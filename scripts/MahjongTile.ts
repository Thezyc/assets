import { _decorator, Component, Node, Vec3, Vec2, log, EventMouse, Input, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MahjongTile')
export class MahjongTile extends Component {
    public originalWorldPosition: Vec3 = new Vec3();
    private isDragging: boolean = false;
    private gridNodes: Node[] = [];
    private gameManager: Node = null;
    private draggedTile: Node | null = null;

    onLoad() {
        // 添加鼠标事件监听器
        this.node.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        // 初始化麻将的原始世界坐标
        this.originalWorldPosition.set(this.node.getWorldPosition());
        log(`MahjongTile initialized at world position: ${this.originalWorldPosition.toString()}`);
    }

    onDestroy() {
        // 移除鼠标事件监听器
        this.node.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    onMouseDown(event: EventMouse) {
        const tile = event.target as Node;
        if (tile) {
            this.draggedTile = tile;
            this.isDragging = true;

            log(`MahjongTile onMouseDown: Initial World Position: ${tile.getWorldPosition().toString()}`);
        }
    }

    onMouseMove(event: EventMouse) {
        if (this.isDragging && this.draggedTile) {
            // 直接使用鼠标的世界坐标更新麻将的位置
            const worldPos = event.getUILocation();
            this.draggedTile.setWorldPosition(new Vec3(worldPos.x, worldPos.y, 0));

            log(`MahjongTile onMouseMove: Dragging World Position: ${this.draggedTile.getWorldPosition().toString()}`);
        }
    }

    onMouseUp(event: EventMouse) {
        if (!this.draggedTile) return;

        const targetPos = event.getUILocation();
        let targetGridNode: Node | null = null;

        // 查找鼠标释放位置所在的格子
        for (const gridNode of this.gridNodes) {
            const gridTransform = gridNode.getComponent(UITransform);
            if (gridTransform && gridTransform.getBoundingBoxToWorld().contains(new Vec2(targetPos.x, targetPos.y))) {
                targetGridNode = gridNode;
                break;
            }
        }

        if (targetGridNode) {
            const gameManager = this.gameManager.getComponent('GameManager') as any;
            const gridNodeMap = gameManager.gridNodeMap;

            // 如果目标格子中已有麻将，交换位置
            if (gridNodeMap.has(targetGridNode)) {
                const targetTile = gridNodeMap.get(targetGridNode);
                const tempWorldPosition = targetTile.getWorldPosition().clone();
                targetTile.setWorldPosition(this.draggedTile.getWorldPosition());
                this.draggedTile.setWorldPosition(tempWorldPosition);

                // 更新映射
                gridNodeMap.set(targetGridNode, this.draggedTile);
                gridNodeMap.set(this.node, targetTile);
            } else {
                // 如果目标格子为空，移动麻将到目标格子
                this.draggedTile.setWorldPosition(targetGridNode.getWorldPosition());

                // 更新映射
                gridNodeMap.delete(this.node);
                gridNodeMap.set(targetGridNode, this.draggedTile);
            }
        } else {
            // 没有有效目标格子，麻将还原到初始位置
            this.draggedTile.setWorldPosition(this.originalWorldPosition);
        }

        log(`MahjongTile onMouseUp: Final World Position: ${this.draggedTile.getWorldPosition().toString()}`);

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