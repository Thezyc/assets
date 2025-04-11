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

            log(`选中麻将位置: Initial Position: ${this.originalPosition.toString()}`);
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
            if (gridTransform) {
                const boundingBox = gridTransform.getBoundingBoxToWorld();
                const x1 = boundingBox.x;
                const y1 = boundingBox.y;
                const x2 = boundingBox.x + boundingBox.width;
                const y2 = boundingBox.y + boundingBox.height;

                // 输出边界框的左上角、右下角以及目标点的坐标
                console.log(`格子遍历中${gridNode.name}:Bounding Box: Top-Left (${x1}, ${y1}), Bottom-Right (${x2}, ${y2}), Target Point (${targetPos.x}, ${targetPos.y})`);

                if (boundingBox.contains(new Vec2(targetPos.x, targetPos.y))) {
                    targetGridNode = gridNode;
                    break;
                }
            }
        }
        
        // 判断目标格子是否有麻将，有则交换，无则直接放入
        if (targetGridNode) {
            const gameManager = this.gameManager.getComponent('GameManager') as any;
            const gridNodeMap = gameManager.gridNodeMap;

            if (gridNodeMap.has(targetGridNode)) {
                const targetTile = gridNodeMap.get(targetGridNode);

                // **修复：排除麻将和目标麻将是同一个的情况**
                if (targetTile === this.draggedTile) {
                    log('麻将释放: Same tile selected, no swap performed.');
                    this.draggedTile.setWorldPosition(this.originalPosition);
                } else {
                    // **修复：交换逻辑**
                    const tempPosition = targetTile.getWorldPosition().clone();
                    targetTile.setWorldPosition(this.draggedTile.getWorldPosition());
                    this.draggedTile.setWorldPosition(tempPosition);

                    // 更新映射关系
                    gridNodeMap.set(targetGridNode, this.draggedTile);
                    gridNodeMap.set(this.node.parent, targetTile);

                    log(`麻将释放，交换格子: Swapped with tile at grid ${targetGridNode.name}`);
                }
            } else {
                // 目标格子为空的情况
                this.draggedTile.setWorldPosition(targetGridNode.getWorldPosition());

                // 更新映射
                gridNodeMap.delete(this.node.parent);
                gridNodeMap.set(targetGridNode, this.draggedTile);

                log(`MahjongTile onMouseUp: Moved to empty grid ${targetGridNode.name}`);
            }
        } else {
            // 如果没有有效目标格子，还原到初始位置
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