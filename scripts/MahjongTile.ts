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
            // 记录麻将的初始世界位置，同时记录原有的父节点（原格子）
            this.originalPosition.set(tile.getWorldPosition());
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
        let targetGridNode: Node | null = this.findNearestGrid(targetPos);

        // 判断鼠标释放位置的情况
        if (targetGridNode) {
            if (this.isGridOccupied(targetGridNode)) {
                // 如果目标格子已被占用，则进行交换
                this.swapTileWithGrid(targetGridNode);
                log(`与格子 ${targetGridNode.name} 内的麻将进行交换`);
            } else {
                // 目标格子没有麻将，则正常放置
                this.placeTileInGrid(targetGridNode);
                log(`放置麻将到格子: ${targetGridNode.name}`);
            }
        } else {
            this.returnToOriginalPosition();
            log('未找到有效格子，返回原位置');
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

    // 新增辅助方法

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

            // 设置一个最大有效距离（比如100像素）
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
        // 检查格子是否已经有子节点（不包括当前拖动的麻将）
        return gridNode.children.length > 0 && 
               gridNode.children[0] !== this.draggedTile;
    }

    /**
     * 将麻将放置到指定格子
     */
    private placeTileInGrid(gridNode: Node) {
        if (!this.draggedTile) return;

        // 设置父节点为目标格子并对齐中心
        this.draggedTile.setParent(gridNode, true);
        this.draggedTile.setPosition(Vec3.ZERO);
        // 更新原始位置
        this.originalPosition.set(this.draggedTile.getWorldPosition());
    }

    /**
     * 返回原始位置
     */
    private returnToOriginalPosition() {
        if (!this.draggedTile) return;

        // 使用世界坐标系设置位置
        this.draggedTile.setWorldPosition(this.originalPosition);
    }

    /**
     * 交换拖拽麻将与目标格子中已有麻将的位置
     */
    private swapTileWithGrid(targetGrid: Node) {
        if (!this.draggedTile) return;

        // 获取拖拽麻将原来的格子（父节点）
        const originalGrid = this.draggedTile.parent;
        if (!originalGrid) {
            // 如果原格子不存在，则无法交换，回到原位置
            this.returnToOriginalPosition();
            return;
        }

        // 获取目标格子中已存在的麻将
        const occupiedTile = targetGrid.children[0];
        if (!occupiedTile) {
            // 这里不应该发生，因为isGridOccupied已经检查过
            this.placeTileInGrid(targetGrid);
            return;
        }

        // 交换步骤：
        // 1. 将拖拽麻将移动到目标格子
        this.draggedTile.setParent(targetGrid, true);
        this.draggedTile.setPosition(Vec3.ZERO);

        // 2. 将目标格子原有的麻将移动到拖拽麻将的原格子
        occupiedTile.setParent(originalGrid, true);
        occupiedTile.setPosition(Vec3.ZERO);

        // 3. 更新各自的原始位置记录
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