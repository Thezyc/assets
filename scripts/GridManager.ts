import { _decorator, Component, Node, Vec3, Prefab, instantiate, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GridManager')
export class GridManager extends Component {
    @property(Prefab)
    gridPrefab: Prefab = null;

    private gridNodes: Node[] = [];

    onLoad() {
        this.createGrid();
    }

    createGrid() {
        const gridSize = 120; // 每个格子的大小
        const leftGridCount = 9; // 左侧3x3的格子数量
        const rightGridCount = 6; // 右侧2x3的格子数量

        // 创建左侧3x3格子
        for (let i = 0; i < leftGridCount; i++) {
            const gridNode = instantiate(this.gridPrefab);
            gridNode.setParent(this.node);
            const row = Math.floor(i / 3);
            const col = i % 3;
            gridNode.setPosition(new Vec3(col * gridSize - 500, -row * gridSize + 200, 0));
            gridNode.setSiblingIndex(0); // 设置格子的显示层级低于麻将
            this.gridNodes.push(gridNode);
        }

        // 创建右侧2x3格子
        // for (let i = 0; i < rightGridCount; i++) {
        //     const gridNode = instantiate(this.gridPrefab);
        //     gridNode.setParent(this.node);
        //     const row = Math.floor(i / 2);
        //     const col = i % 2;
        //     gridNode.setPosition(new Vec3(col * gridSize - 200, -row * gridSize + 200, 0));
        //     gridNode.setSiblingIndex(0); // 设置格子的显示层级低于麻将
        //     this.gridNodes.push(gridNode);
        // }
    }

    getGridNodes() {
        return this.gridNodes;
    }
}