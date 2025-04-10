import { _decorator, Component, Prefab, Node, Sprite, SpriteFrame, instantiate, Vec3, resources, log, UITransform, EventTouch, Button, Label, find } from 'cc';
import { MahjongTile } from './MahjongTile';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Prefab)
    tilePrefab: Prefab = null;

    @property([SpriteFrame])
    tileSprites: SpriteFrame[] = [];

    @property(Prefab)
    monsterPrefab: Prefab = null; // 怪物预制资源

    private tiles: Node[] = [];
    private gridNodes: Node[] = [];
    private gridNodeMap: Map<Node, Node> = new Map();

    onLoad() {
        log('GameManager onLoad');

        // 加载麻将牌图片资源并初始化麻将牌
        this.loadTileSprites().then(() => {
            this.initTiles();
        }).catch((err) => {
            log(`Error loading tile sprites: ${err}`);
        });


        // 获取 Grids 节点
        const gridsNode = find('Canvas/Grids');
        if (gridsNode) {
            this.gridNodes = gridsNode.children;
            log(`Found ${this.gridNodes.length} grids`);
            this.gridNodes.forEach((node, index) => log(`Grid ${index}: ${node.name}`));
        } else {
            log('Grids node not found');
        }
    }

    onDestroy() {

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
        for (let i = 0; i < 136; i++) {
            let tile = instantiate(this.tilePrefab);
            if (!tile) {
                log(`Error: Tile prefab instantiation failed at index ${i}`);
                continue;
            }
            let sprite = tile.getComponent(Sprite);
            if (!sprite) {
                log(`Error: Sprite component not found on tile at index ${i}`);
                continue;
            }
            sprite.spriteFrame = this.tileSprites[i % this.tileSprites.length];
            let tileScript = tile.getComponent(MahjongTile);
            if (tileScript) {
                tileScript.setGameManager(this.node);
                tileScript.setGridNodes(this.gridNodes); // 设置格子节点
                tileScript.setGridNodeMap(this.gridNodeMap); // 设置格子节点映射关系
            } else {
                log(`Error: MahjongTile component not found on tilePrefab at index ${i}`);
            }
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
            tile.getComponent(MahjongTile).originalPosition.set(tile.position);
        }
    }

}