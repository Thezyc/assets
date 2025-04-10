import { _decorator, Component, Node, Vec3, log, EventMouse, Input, UITransform, view, find } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MahjongTile')
export class MahjongTile extends Component {
    public originalPosition: Vec3 = new Vec3();
    private isDragging: boolean = false;
    private gridNodes: Node[] = [];
    private gameManager: Node = null;
    private gridNodeMap: Map<Node, Node> = new Map(); // 用于记录格子和麻将的映射关系

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
        this.isDragging = true;

        

    }

    onMouseMove(event: EventMouse) {
        if (this.isDragging) {
            // 更新麻将牌的位置
            
        }
    }

    onMouseUp(event: EventMouse) {
        this.isDragging = false;

        // 如果拖拽到可放置的格子，将麻将放置在该格子，否则恢复到原始位置
        

        // 添加麻将牌移动完成后的日志
        log(`Tile ${this.node.name} moved to position: ${this.node.position}`);
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