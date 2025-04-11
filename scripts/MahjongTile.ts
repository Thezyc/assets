import { _decorator, Component, Node, Vec3, log, EventMouse, Input, UITransform, view, find } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MahjongTile')
export class MahjongTile extends Component {
    public originalPosition: Vec3 = new Vec3();
    private isDragging: boolean = false;
    private gridNodes: Node[] = [];
    private gameManager: Node = null;
    private gridNodeMap: Map<Node, Node> = new Map(); // 用于记录格子和麻将的映射关系
    private draggedTile: Node | null = null;

    onLoad() {

        // 保存麻将牌的初始位置
        this.originalPosition.set(this.node.position);

        // 添加鼠标事件监听器
        this.node.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        // 获取 Grids 节点
        const gridsNode = find('Canvas/Grids');
        if (gridsNode) {
            this.gridNodes = gridsNode.children;
            log(`Found ${this.gridNodes.length} grids`);
        } else {
            log('Grids node not found');
        }
    }

    onDestroy() {
        // 移除鼠标事件监听器
        this.node.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    onMouseDown(event: EventMouse) {
        const tile = event.target;
        if(tile){
            this.draggedTile = tile as Node; // 存储被拖拽的麻将
            this.originalPosition.set(tile.position);// 记录麻将牌的初始位置
            this.isDragging = true;
        }

        

    }

    onMouseMove(event: EventMouse) {
        if (this.isDragging) {
            // 更新麻将牌的位置
            if(this.isDragging && this.draggedTile) {
                // 将麻将牌的世界坐标转换为当前鼠标位置
                const worldPos = event.getLocation();
                const localPos = this.node.getComponent(UITransform)?.convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y, 0)); // 转换为局部坐标
                this.draggedTile.setPosition(localPos); // 更新麻将位置
            }
        }
    }   

    onMouseUp(event: EventMouse) {
        if (!this.draggedTile) return;
        
        const targetPos = event.getLocation();
        let targetGridNode: Node | null = null;
    
        // 查找当前鼠标位置所在的格子
        for (let i = 0; i < this.gridNodes.length; i++) {
            const gridNode = this.gridNodes[i];
            const gridTransform = gridNode.getComponent(UITransform);
            
            // 计算麻将牌和每个格子的距离
            const gridRect = gridTransform.getBoundingBoxToWorld();
            if (gridRect.contains(targetPos)) {
                targetGridNode = gridNode;
                break;
            }
        }
    
        if (targetGridNode) {
            // 获取目标格子是否已有麻将
            const targetTile = targetGridNode.getComponent('TileScript'); // 假设你有TileScript脚本管理每个格子上的麻将
            if (targetTile && targetTile.tile) {
                // 交换位置
                const targetTileNode = targetTile.tile;
                const tempPos = targetTileNode.position.clone();
                targetTileNode.setPosition(this.draggedTile.position);
                draggedTile.setPosition(tempPos);
            } else {
                // 如果目标格子为空，则将麻将移到目标格子
                draggedTile.setPosition(targetGridNode.position);
            }
        } else {
            // 如果没有有效目标格子，将麻将还原回原位置
            draggedTile.setPosition(originalPosition);
        }
    
        // 重置拖拽状态
        this.isDragging = false;
        draggedTile = null;
    }


    resetTilePosition() {
        this.node.setPosition(this.originalPosition);
    }

    setGameManager(gameManager: Node) {
        this.gameManager = gameManager;
    }

    setGridNodes(gridNodes: Node[]) {
        this.gridNodes = gridNodes;
    }

    setGridNodeMap(gridNodeMap: Map<Node, Node>) {
        this.gridNodeMap = gridNodeMap;
    }

}