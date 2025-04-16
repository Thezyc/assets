import { _decorator, Component, Node, Vec3, log, EventMouse, Input, UITransform, find, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MahjongTile')
export class MahjongTile extends Component {
    public originalPosition: Vec3 = new Vec3();
    private isDragging: boolean = false;
    private gridNodes: Node[] = [];
    private gameManager: Node = null;
    private draggedTile: Node | null = null;

    onLoad() {
        this.originalPosition.set(this.node.position);

        this.node.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        const gridsNode = find('Canvas/Grids');
        if (gridsNode) {
            this.gridNodes = gridsNode.children;
            log(`Found ${this.gridNodes.length} grids`);
        } else {
            log('Grids node not found');
        }
    }

    onDestroy() {
        this.node.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    onMouseDown(event: EventMouse) {
        const tile = event.target as Node;
        if (tile) {
            this.draggedTile = tile;
            this.originalPosition.set(tile.getWorldPosition()); // 记录麻将的初始世界位置
            this.isDragging = true;

            log(`选中麻将位置: ${this.originalPosition.toString()}`);
        }
    }

    onMouseMove(event: EventMouse) {
        if (this.isDragging && this.draggedTile) {
            const worldPos = event.getUILocation();
            this.draggedTile.setWorldPosition(new Vec3(worldPos.x, worldPos.y, 0));

            // log(`MahjongTile onMouseMove: Dragging Position: ${this.draggedTile.getWorldPosition().toString()}`);
        }
    }

    onMouseUp(event: EventMouse) {
        if (!this.draggedTile) return;

        const targetPos = event.getUILocation();
        let targetGridNode: Node | null = null;

        // 查找鼠标释放位置所在的格子
        for (const gridNode of this.gridNodes) {
            const gridTransform = gridNode.getComponent(UITransform);
            log(gridNode.name + '包围盒: ' + gridTransform.getBoundingBoxToWorld().toString());
            if (gridTransform) {
                const boundingBox = gridTransform.getBoundingBoxToWorld();
                if (boundingBox.contains(new Vec2(targetPos.x, targetPos.y))) {
                    targetGridNode = gridNode;
                    break;
                }
            }
        }
        
        if (targetGridNode) {
            const gameManager = this.gameManager.getComponent('GameManager') as any;
            const gridNodeMap = gameManager.gridNodeMap;
            log(`麻将释放位置: ${targetGridNode.name}`);
            if (gridNodeMap.has(targetGridNode)) {
                const targetTile = gridNodeMap.get(targetGridNode);

                if (targetTile === this.draggedTile) {
                    log('麻将释放: Same tile selected, no swap performed.');
                    this.draggedTile.setWorldPosition(this.originalPosition);
                } else {
                    const tempPosition = targetTile.getWorldPosition().clone();
                    targetTile.setWorldPosition(this.draggedTile.getWorldPosition());
                    this.draggedTile.setWorldPosition(tempPosition);

                    gridNodeMap.set(targetGridNode, this.draggedTile);
                    gridNodeMap.set(this.node.parent, targetTile);

                    log(`麻将释放，交换格子: Swapped with tile at grid ${targetGridNode.name}`);
                }
            } else {
                this.draggedTile.setWorldPosition(targetGridNode.getWorldPosition());

                gridNodeMap.delete(this.node.parent);
                gridNodeMap.set(targetGridNode, this.draggedTile);

                log(`MahjongTile onMouseUp: Moved to empty grid ${targetGridNode.name}`);
            }
        } else {
            this.draggedTile.setWorldPosition(this.originalPosition);
            log(`MahjongTile onMouseUp: Returned to original position: ${this.originalPosition.toString()}`);
        }

        this.isDragging = false;
        this.draggedTile = null;
    }

    setGameManager(gameManager: Node) {
        this.gameManager = gameManager;
    }

    setGridNodes(gridNodes: Node[]) {
        this.gridNodes = gridNodes;
    }
}