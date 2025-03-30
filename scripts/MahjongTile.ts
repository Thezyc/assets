import { _decorator, Component, Node, Vec3, log, EventMouse, input, Input, UITransform, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MahjongTile')
export class MahjongTile extends Component {
    private isRaised: boolean = false;
    public originalPosition: Vec3 = new Vec3();
    private gameManager: Node = null;
    private isDragging: boolean = false;
    private offset: Vec3 = new Vec3();
    private gridNodes: Node[] = [];

    onLoad() {
        // 设置麻将的显示层级
        this.node.setSiblingIndex(1000);

        // 保存麻将牌的初始位置
        this.originalPosition.set(this.node.position);
        // 添加点击事件监听
        this.node.on(Node.EventType.TOUCH_END, this.onTileClicked, this);

        // 添加鼠标事件监听器
        this.node.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        // 获取 Slots 节点
        const slotsNode = director.getScene().getChildByName('Slots');
        if (slotsNode) {
            this.gridNodes = slotsNode.children;
        }
    }

    onDestroy() {
        // 移除鼠标事件监听器
        this.node.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    onTileClicked() {
        log(`Tile clicked: ${this.node.name}`);
        if (this.isRaised) {
            // 如果麻将牌已抬起，再次点击将其弃出
            this.gameManager.getComponent('GameManager').discardTile(this.node);
        } else {
            // 如果麻将牌未抬起，抬起麻将牌
            this.gameManager.getComponent('GameManager').raiseTile(this.node);
        }
    }

    onMouseDown(event: EventMouse) {
        this.isDragging = true;

        // 计算鼠标点击位置与麻将牌节点位置的偏移量
        const uiTransform = this.node.getComponent(UITransform);
        if (uiTransform) {
            const localMousePos = uiTransform.convertToNodeSpaceAR(new Vec3(event.getUILocation().x, event.getUILocation().y, 0));
            this.offset = this.node.position.subtract(localMousePos);
        }

        // 当开始拖拽时，将麻将的显示层级提高
        this.node.setSiblingIndex(2000);
    }

    onMouseMove(event: EventMouse) {
        if (this.isDragging) {
            // 更新麻将牌的位置
            const uiTransform = this.node.getComponent(UITransform);
            if (uiTransform) {
                const localMousePos = uiTransform.convertToNodeSpaceAR(new Vec3(event.getUILocation().x, event.getUILocation().y, 0));
                this.node.setPosition(localMousePos.add(this.offset));
            }
        }
    }

    onMouseUp(event: EventMouse) {
        this.isDragging = false;

        // 获取麻将牌的边界框
        const uiTransform = this.node.getComponent(UITransform);
        const tileBoundingBox = uiTransform.getBoundingBoxToWorld();

        // 检查是否在格子内
        let closestGridNode = null;
        let minDistance = Infinity;

        for (let i = 0; i < this.gridNodes.length; i++) {
            const gridNode = this.gridNodes[i];
            const gridTransform = gridNode.getComponent(UITransform);
            const gridBoundingBox = gridTransform.getBoundingBoxToWorld();

            // 判断麻将牌的大部分区域是否与格子的边界框相交
            if (gridBoundingBox.intersects(tileBoundingBox)) {
                // 计算距离
                const distance = this.node.position.subtract(gridNode.position).length();
                if (distance < minDistance) {
                    minDistance = distance;
                    closestGridNode = gridNode;
                }
            }
        }

        if (closestGridNode) {
            // 将麻将牌放置在最近的格子中心，并恢复正常的显示层级
            this.node.setPosition(closestGridNode.position);
            this.node.setSiblingIndex(1000);
        } else {
            // 如果不在格子内，恢复到原始位置，并恢复正常的显示层级
            this.node.setPosition(this.originalPosition);
            this.node.setSiblingIndex(1000);
        }
    }

    setGameManager(gameManager: Node) {
        this.gameManager = gameManager;
    }

    raise() {
        // this.node.setPosition(this.originalPosition.clone().add3f(0, 50, 0)); // 基于初始位置抬起
        // this.isRaised = true;
    }
    
    lower() {
        // this.node.setPosition(this.originalPosition); // 恢复到初始位置
        // this.isRaised = false;
    }
}