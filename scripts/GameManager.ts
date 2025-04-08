import { _decorator, Component, Prefab, Node, Sprite, SpriteFrame, instantiate, Vec3, resources, log, UITransform, EventTouch, Button, Label, find } from 'cc';
import { MahjongTile } from './MahjongTile';
import { HuPaiChecker } from './HuPaiChecker';
import Monster from './Monster'; // 引入Monster类
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Prefab)
    tilePrefab: Prefab = null;

    @property([SpriteFrame])
    tileSprites: SpriteFrame[] = [];

    @property(Node)
    huButton: Node = null; // 胡牌按钮

    @property(Node)
    huResultPopup: Node = null; // 计分窗口

    @property(Prefab)
    monsterPrefab: Prefab = null; // 怪物预制资源

    private tiles: Node[] = [];
    private raisedTile: Node = null;
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

        // 初始化胡牌按钮
        if (this.huButton) {
            log('huButton found');
            this.huButton.active = false;
            this.huButton.on(Button.EventType.CLICK, this.onHuButtonClick, this);
        } else {
            log('huButton not found');
        }

        // 初始化计分窗口
        if (this.huResultPopup) {
            log('huResultPopup found');
            this.huResultPopup.active = false;
        } else {
            log('huResultPopup not found');
        }

        // 定时生成怪物
        this.schedule(this.spawnMonster, 2);

        // 获取 Slots 节点
        const slotsNode = find('Canvas/Slots');
        if (slotsNode) {
            this.gridNodes = slotsNode.children;
            log(`Found ${this.gridNodes.length} slots`);
            this.gridNodes.forEach((node, index) => log(`Slot ${index}: ${node.name}`));
        } else {
            log('Slots node not found');
        }
    }

    onDestroy() {
        // 移除屏幕点击事件监听
        this.node.off(Node.EventType.TOUCH_START, this.onScreenTouch, this);
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
        const slotCount = Math.min(this.tiles.length, this.gridNodes.length);
        for (let i = 0; i < 13; i++) {
            let tile = this.tiles.pop();
            if (!tile) {
                log(`Error: Tile is null at index ${i}`);
                continue;
            }
            let gridNode = this.gridNodes[i];
            log(`Dealing tile ${tile.name} to slot ${gridNode.name}`);
            tile.setParent(gridNode, false);
            tile.setPosition(Vec3.ZERO);

            // 保存每个麻将的初始位置
            tile.getComponent(MahjongTile).originalPosition.set(tile.position);
        }
    }

    raiseTile(tile: Node) {
        if (this.raisedTile && this.raisedTile !== tile) {
            this.raisedTile.getComponent(MahjongTile).lower();
        }
        tile.getComponent(MahjongTile).raise();
        this.raisedTile = tile;
    }

    discardTile(tile: Node) {
        log(`Discarding tile: ${tile.name}`);
        tile.removeFromParent();
        this.raisedTile = null;
    }

    spawnMonster() {
        const monster = instantiate(this.monsterPrefab);
        monster.parent = this.node;
        const uiTransform = monster.getComponent(UITransform);
        monster.setPosition(cc.winSize.width * 0.9 + uiTransform.width / 2, Math.random() * cc.winSize.height);
    }
}