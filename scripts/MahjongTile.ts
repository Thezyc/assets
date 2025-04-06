import { _decorator, Component, Node, Vec3, log, EventMouse, Input, UITransform, director, find } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MahjongTile')
export class MahjongTile extends Component {
    public originalPosition: Vec3 = new Vec3();
    private isDragging: boolean = false;
    private offset: Vec3 = new Vec3();
    private gridNodes: Node[] = [];
    private gameManager: Node = null;
    private gridNodeMap: Map<Node, Node> = new Map(); // 用于记录格子和麻将的映射关系

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

        // 检查是否在格子内
        if (!this.gridNodes || this.gridNodes.length === 0) {
            log('Grid nodes not found or empty.');
            return;
        }

        let closestGridNode = null;
        let minDistance = Infinity;

        for (let i = 0; i < this.gridNodes.length; i++) {
            const gridNode = this.gridNodes[i];
            const gridTransform = gridNode.getComponent(UITransform);
            if (!gridTransform) {
                log(`UITransform component not found on grid node at index ${i}.`);
                continue;
            }
            const gridCenter = gridTransform.convertToWorldSpaceAR(Vec3.ZERO);

            // 判断麻将牌的中心点是否与格子的边界框相交
            if (gridTransform.getBoundingBoxToWorld().contains(tileCenter)) {
                // 计算麻将牌中心与格子中心的距离
                const distance = tileCenter.subtract(gridCenter).length();
                if (distance < minDistance) {
                    minDistance = distance;
                    closestGridNode = gridNode;
                }
            }
        }

        if (closestGridNode) {
            const existingTile = this.gridNodeMap.get(closestGridNode);
            if (existingTile) {
                // 如果格子中已有麻将，与当前麻将交换位置
                const existingTilePosition = existingTile.getPosition();
                const currentTilePosition = this.node.getPosition();

                existingTile.setPosition(currentTilePosition);
                this.node.setPosition(existingTilePosition);

                // 更新映射关系
                this.gridNodeMap.set(closestGridNode, this.node);
                const originalGridNode = [...this.gridNodeMap.entries()].find(([key, value]) => value === existingTile)?.[0];
                if (originalGridNode) {
                    this.gridNodeMap.set(originalGridNode, existingTile);
                }

                // 重置状态，避免重复交换
                this.isDragging = false;
            } else {
                // 将麻将牌放置在最近的格子中心
                this.node.setPosition(closestGridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(0, 0, 0)));
                this.gridNodeMap.set(closestGridNode, this.node);
            }
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