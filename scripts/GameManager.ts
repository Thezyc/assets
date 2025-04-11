import { _decorator, Component, Prefab, Node, Sprite, SpriteFrame, instantiate, Vec3, resources, log, find } from 'cc';
import { MahjongTile } from './MahjongTile';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Prefab)
    tilePrefab: Prefab = null;

    @property([SpriteFrame])
    tileSprites: SpriteFrame[] = [];

    private tiles: Node[] = [];
    public gridNodes: Node[] = [];
    public gridNodeMap: Map<Node, Node> = new Map();

    onLoad() {
        log('GameManager onLoad');

        // 获取 Grids 节点
        const gridsNode = find('Canvas/Grids');
        if (gridsNode) {
            this.gridNodes = gridsNode.children;
            log(`Found ${this.gridNodes.length} grids`);
        } else {
            log('Grids node not found');
        }

        this.loadTileSprites().then(() => {
            this.initTiles();
        }).catch((err) => {
            log(`Error loading tile sprites: ${err}`);
        });
    }

    async loadTileSprites() {
        return new Promise<void>((resolve, reject) => {
            resources.loadDir('output', SpriteFrame, (err, frames) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (frames.length === 0) {
                    reject('No tile sprites found');
                    return;
                }
                this.tileSprites = frames;
                log(`Loaded ${frames.length} tile sprites`);
                resolve();
            });
        });
    }

    initTiles() {
        log('Initializing tiles');
        if (!this.tilePrefab) {
            log('Error: tilePrefab is null');
            return;
        }

        for (let i = 0; i < this.gridNodes.length; i++) {
            const gridNode = this.gridNodes[i];

            // 创建麻将并设置精灵
            const tile = instantiate(this.tilePrefab);
            const sprite = tile.getComponent(Sprite);
            sprite.spriteFrame = this.tileSprites[i % this.tileSprites.length];

            // 使用世界坐标初始化麻将的位置
            const gridWorldPos = gridNode.getWorldPosition();
            tile.setWorldPosition(gridWorldPos);

            // 初始化 MahjongTile 脚本
            const tileScript = tile.getComponent(MahjongTile);
            tileScript.setGameManager(this.node);
            tileScript.setGridNodes(this.gridNodes);

            // 记录到 gridNodeMap
            this.gridNodeMap.set(gridNode, tile);

            this.tiles.push(tile);
        }
        this.shuffleTiles();
        this.dealTiles();
    }

    shuffleTiles() {
        log('Shuffling tiles');
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
    }

    dealTiles() {
        log('Dealing tiles');
        const gridCount = Math.min(this.tiles.length, this.gridNodes.length);
        for (let i = 0; i < 13; i++) {
            let tile = this.tiles.pop();
            if (!tile) {
                log(`Error: Tile is null at index ${i}`);
                continue;
            }
            let gridNode = this.gridNodes[i];
            log(`Dealing tile ${tile.name} to grid ${gridNode.name}`);
            tile.setParent(gridNode, false);
            tile.setPosition(Vec3.ZERO);

            // 保存每个麻将的初始位置
            tile.getComponent(MahjongTile).originalWorldPosition.set(tile.position);
        }
    }

}