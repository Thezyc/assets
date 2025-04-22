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

        // 判断鼠标释放位置的情况，有格子则放入，无格子则返回原点
        
        if (targetGridNode) {
            
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