import { _decorator, Component, Node, Vec3, log, EventMouse, Input, UITransform, find, Vec2, input } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MahjongTile')
export class MahjongTile extends Component {
    public originalPosition: Vec3 = new Vec3();
    private isDragging: boolean = false;
    private gridNodes: Node[] = [];
    private gameManager: Node = null;
    private draggedTile: Node | null = null;

    // 静态变量，用于全局记录当前正在拖拽的实例
    private static currentDragging: MahjongTile | null = null;

    onLoad() {
        this.originalPosition.set(this.node.position);

        // 本地事件监听
        this.node.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        // 使用 input 全局监听 MOUSE_UP 事件，确保在任意区域释放鼠标时都能触发拖拽结束
        input.on(Input.EventType.MOUSE_UP, this.onGlobalMouseUp, this);

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
        input.off(Input.EventType.MOUSE_UP, this.onGlobalMouseUp, this);

        // 如果当前实例是正在拖拽的实例，则置空
        if (MahjongTile.currentDragging === this) {
            MahjongTile.currentDragging = null;
        }
    }

    onMouseDown(event: EventMouse) {
        // 如果已有其他麻将正在拖拽，先结束它的拖拽操作
        if (MahjongTile.currentDragging && MahjongTile.currentDragging !== this) {
            MahjongTile.currentDragging.forceEndDrag();
        }
        
        const tile = event.target as Node;
        if (tile) {
            this.draggedTile = tile;
            // 记录麻将的原始世界位置
            this.originalPosition.set(tile.getWorldPosition());
            this.isDragging = true;
            // 更新当前正在拖拽的实例
            MahjongTile.currentDragging = this;
            log(`选中麻将位置: ${this.originalPosition.toString()}`);
        }
    }

    onMouseMove(event: EventMouse) {
        if (this.isDragging && this.draggedTile) {
            const worldPos = event.getUILocation();
            this.draggedTile.setWorldPosition(new Vec3(worldPos.x, worldPos.y, 0));
        }
    }

    onMouseUp(event: EventMouse) {
        if (!this.draggedTile) return;
        const targetPos = event.getUILocation();
        let targetGridNode: Node | null = this.findNearestGrid(targetPos);
        if (targetGridNode) {
            if (this.isGridOccupied(targetGridNode)) {
                this.swapTileWithGrid(targetGridNode);
                log(`与格子 ${targetGridNode.name} 内的麻将进行交换`);
            } else {
                this.placeTileInGrid(targetGridNode);
                log(`放置麻将到格子: ${targetGridNode.name}`);
            }
        } else {
            this.returnToOriginalPosition();
            log('未找到有效格子，返回原位置');
        }
        this.endDrag();
    }

    /**
     * 全局 MOUSE_UP 回调，确保鼠标任意释放时都能重置拖拽状态
     */
    private onGlobalMouseUp(event: EventMouse) {
        // 仅对当前正在拖拽的实例生效
        if (this.isDragging) {
            this.onMouseUp(event);
        }
    }

    /**
     * 强制结束拖拽，恢复到原始位置，并重置拖拽状态
     */
    public forceEndDrag() {
        if (this.isDragging) {
            this.returnToOriginalPosition();
            this.endDrag();
            log(`强制结束拖拽，麻将返回原位`);
        }
    }

    /**
     * 结束拖拽，清理状态
     */
    private endDrag() {
        this.isDragging = false;
        this.draggedTile = null;
        if (MahjongTile.currentDragging === this) {
            MahjongTile.currentDragging = null;
        }
    }

    setGameManager(gameManager: Node) {
        this.gameManager = gameManager;
    }

    setGridNodes(gridNodes: Node[]) {
        this.gridNodes = gridNodes;
    }

    /**
     * 找到最近的有效格子
     */
    private findNearestGrid(targetPos: Vec2): Node | null {
        if (!this.gridNodes || this.gridNodes.length === 0) return null;
        let nearestGrid: Node | null = null;
        let minDistance = Number.MAX_VALUE;
        for (const grid of this.gridNodes) {
            const gridPos = grid.getWorldPosition();
            const distance = Vec2.distance(
                new Vec2(targetPos.x, targetPos.y),
                new Vec2(gridPos.x, gridPos.y)
            );
            if (distance < minDistance && distance < 100) {
                minDistance = distance;
                nearestGrid = grid;
            }
        }
        return nearestGrid;
    }

    /**
     * 检查格子是否已被占用
     */
    private isGridOccupied(gridNode: Node): boolean {
        return gridNode.children.length > 0 && 
               gridNode.children[0] !== this.draggedTile;
    }

    /**
     * 将麻将放置到指定格子
     */
    private placeTileInGrid(gridNode: Node) {
        if (!this.draggedTile) return;
        this.draggedTile.setParent(gridNode, true);
        this.draggedTile.setPosition(Vec3.ZERO);
        this.originalPosition.set(this.draggedTile.getWorldPosition());
    }

    /**
     * 返回原始位置
     */
    private returnToOriginalPosition() {
        if (!this.draggedTile) return;
        this.draggedTile.setWorldPosition(this.originalPosition);
    }

    /**
     * 交换拖拽麻将与目标格子中已有麻将的位置
     */
    private swapTileWithGrid(targetGrid: Node) {
        if (!this.draggedTile) return;
        const originalGrid = this.draggedTile.parent;
        if (!originalGrid) {
            this.returnToOriginalPosition();
            return;
        }
        const occupiedTile = targetGrid.children[0];
        if (!occupiedTile) {
            this.placeTileInGrid(targetGrid);
            return;
        }
        this.draggedTile.setParent(targetGrid, true);
        this.draggedTile.setPosition(Vec3.ZERO);
        occupiedTile.setParent(originalGrid, true);
        occupiedTile.setPosition(Vec3.ZERO);
        const draggedTileScript = this.draggedTile.getComponent(MahjongTile);
        if (draggedTileScript) {
            draggedTileScript.originalPosition.set(this.draggedTile.getWorldPosition());
        }
        const occupiedTileScript = occupiedTile.getComponent(MahjongTile);
        if (occupiedTileScript) {
            occupiedTileScript.originalPosition.set(occupiedTile.getWorldPosition());
        }
    }
}