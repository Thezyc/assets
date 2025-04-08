import { _decorator, Component, Node, Vec3, log, EventMouse, Input, UITransform, view, find } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MahjongTile')
export class MahjongTile extends Component {
    public originalPosition: Vec3 = new Vec3();
    private isDragging: boolean = false;
    private offset: Vec3 = new Vec3();
    private gridNodes: Node[] = [];
    private gameManager: Node = null;
    private gridNodeMap: Map<Node, Node> = new Map(); // 用于记录格子和麻将的映射关系

    // 定义一个常量，表示圆形区域的半径
    private static readonly PLACEMENT_RADIUS: number = 50;

    onLoad() {
        // 设置麻将的显示层级
        this.node.setSiblingIndex(1000);

        // 保存麻将牌的初始位置
        this.originalPosition.set(this.node.position);

        // 添加鼠标事件监听器
        this.node.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        // 获取 Slots 节点
        const slotsNode = find('Canvas/Slots');
        if (slotsNode) {
            this.gridNodes = slotsNode.children;
            log(`Found ${this.gridNodes.length} slots`);
        } else {
            log('Slots node not found');
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

        // 获取麻将牌的中心点
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            log('UITransform component not found on tile.');
            return;
        }
        const tileCenter = uiTransform.convertToWorldSpaceAR(Vec3.ZERO);

        // 查找最近的网格节点
        const closestGridNode = this.findClosestGridNode(tileCenter);

        // 如果找到最近的空格子，将麻将放置在该格子中心，否则恢复到原始位置
        if (closestGridNode) {
            this.placeTileInGridNode(closestGridNode);
        } else {
            this.resetTilePosition();
        }

        // 添加麻将牌移动完成后的日志
        log(`Tile ${this.node.name} moved to position: ${this.node.position}`);
    }

    findClosestGridNode(tileCenter: Vec3): Node | null {
        if (!this.gridNodes || this.gridNodes.length === 0) {
            log('Grid nodes not found or empty.');
            return null;
        }

        for (const gridNode of this.gridNodes) {
            const gridTransform = gridNode.getComponent(UITransform);
            if (!gridTransform) {
                log(`UITransform component not found on grid node ${gridNode.name}.`);
                continue;
            }
            const gridBoundingBox = gridTransform.getBoundingBoxToWorld();

            // 判断麻将牌的中心点是否在网格节点的边界框内
            if (gridBoundingBox.contains(tileCenter)) {
                return gridNode;
            }
        }

        return null;
    }

    placeTileInGridNode(gridNode: Node) {
        const gridTransform = gridNode.getComponent(UITransform);
        if (gridTransform) {
            const newTilePosition = gridTransform.convertToNodeSpaceAR(new Vec3(0, 0, 0));
            this.node.setPosition(newTilePosition);

            // Ensure the new position is within screen boundaries
            const screenSize = view.getVisibleSize();
            const tilePosition = this.node.position;
            tilePosition.x = Math.max(0, Math.min(screenSize.width, tilePosition.x));
            tilePosition.y = Math.max(0, Math.min(screenSize.height, tilePosition.y));
            this.node.setPosition(tilePosition);

            this.gridNodeMap.set(gridNode, this.node);
        }

        this.node.setSiblingIndex(1000);
    }

    resetTilePosition() {
        this.node.setPosition(this.originalPosition);
        this.node.setSiblingIndex(1000);
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

    raise() {
        // this.node.setPosition(this.originalPosition.clone().add3f(0, 50, 0)); // 基于初始位置抬起
        // this.isRaised = true;
    }
    
    lower() {
        // this.node.setPosition(this.originalPosition); // 恢复到初始位置
        // this.isRaised = false;
    }
}