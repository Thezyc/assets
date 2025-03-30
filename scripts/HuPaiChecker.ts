class HuPaiChecker {
    private tiles: { [key: string]: number[] };

    constructor() {
        this.tiles = {
            feng: new Array(4).fill(0),
            jian: new Array(3).fill(0),
            wan: new Array(9).fill(0),
            tong: new Array(9).fill(0),
            tiao: new Array(9).fill(0),
        };
    }

    setTiles(tiles: { [key: string]: number[] }) {
        this.tiles = tiles;
    }

    isHu(): boolean {
        for (let type in this.tiles) {
            for (let i = 0; i < this.tiles[type].length; i++) {
                if (this.tiles[type][i] >= 2) {
                    this.tiles[type][i] -= 2;
                    let tempTiles = JSON.parse(JSON.stringify(this.tiles));
                    if (this.isMentsuAll(tempTiles)) {
                        this.tiles[type][i] += 2;
                        return true;
                    }
                    this.tiles[type][i] += 2;
                }
            }
        }
        return false;
    }

    private isMentsuAll(tiles: { [key: string]: number[] }): boolean {
        for (let type in tiles) {
            if (!this.isMentsu(tiles[type])) {
                return false;
            }
        }
        return true;
    }

    private isMentsu(tiles: number[]): boolean {
        let tilesCopy = tiles.slice();
        for (let i = 0; i < tilesCopy.length; i++) {
            if (tilesCopy[i] >= 3) {
                tilesCopy[i] -= 3;
                i--;
                continue;
            }
            if (i + 2 < tilesCopy.length && tilesCopy[i] > 0 && tilesCopy[i + 1] > 0 && tilesCopy[i + 2] > 0) {
                tilesCopy[i]--;
                tilesCopy[i + 1]--;
                tilesCopy[i + 2]--;
                i--;
                continue;
            }
        }
        return tilesCopy.every(count => count === 0);
    }

    // 检测清一色
    checkQingYiSe(): boolean {
        const colorTypes = ['wan', 'tong', 'tiao'];
        let colorCount = 0;
        for (let color of colorTypes) {
            if (this.tiles[color].some(count => count > 0)) {
                colorCount++;
            }
        }
        const hasNoZi = this.tiles['feng'].every(count => count === 0) && this.tiles['jian'].every(count => count === 0);
        return colorCount === 1 && hasNoZi;
    }

    // 检测混一色
    checkHunYiSe(): boolean {
        const colorTypes = ['wan', 'tong', 'tiao'];
        let colorCount = 0;
        for (let color of colorTypes) {
            if (this.tiles[color].some(count => count > 0)) {
                colorCount++;
            }
        }
        const hasZi = this.tiles['feng'].some(count => count > 0) || this.tiles['jian'].some(count => count > 0);
        return colorCount === 1 && hasZi;
    }

    // 检测碰碰和
    checkPengPengHu(): boolean {
        for (let type in this.tiles) {
            let tileCopy = [...this.tiles[type]];
            let hasPair = false;
            
            for (let i = 0; i < tileCopy.length; i++) {
                if (tileCopy[i] >= 2) {
                    if (hasPair) {
                        continue; // 如果已经有将牌，跳过多余的将牌
                    }
                    hasPair = true;
                    tileCopy[i] -= 2; // 移除将牌
                }
            }

            if (!tileCopy.every(count => count % 3 === 0)) {
                return false; // 如果剩余的牌不能被3整除，返回false
            }
        }
        return true;
    }

    // 检测断幺九
    checkDuanYaoJiu(): boolean {
        for (let i = 0; i < 9; i++) {
            if (i === 0 || i === 8) {
                if (this.tiles['wan'][i] > 0 || this.tiles['tong'][i] > 0 || this.tiles['tiao'][i] > 0) {
                    return false;
                }
            }
        }
        return this.tiles['feng'].every(count => count === 0) && this.tiles['jian'].every(count => count === 0);
    }

    // 检测平和
    checkPingHu(): boolean {
        let hasPair = false;
        let totalMentsu = 0;

        for (let type in this.tiles) {
            let tileCopy = [...this.tiles[type]];
            
            for (let i = 0; i < tileCopy.length; i++) {
                if (tileCopy[i] >= 2) {
                    if (hasPair) {
                        continue; // 忽略多余的将牌
                    }
                    hasPair = true;
                    tileCopy[i] -= 2;
                }
            }

            totalMentsu += this.countShunzi(tileCopy);
        }

        return hasPair && totalMentsu === 4;
    }

    private countShunzi(tiles: number[]): number {
        let tilesCopy = tiles.slice();
        let shunziCount = 0;

        for (let i = 0; i < tilesCopy.length; i++) {
            while (i + 2 < tilesCopy.length && tilesCopy[i] > 0 && tilesCopy[i + 1] > 0 && tilesCopy[i + 2] > 0) {
                tilesCopy[i]--;
                tilesCopy[i + 1]--;
                tilesCopy[i + 2]--;
                shunziCount++;
            }
        }
        return shunziCount;
    }

    // 检测鸡胡
    checkJiHu(): boolean {
        return true; // 鸡胡默认返回true
    }

    // 获取满足条件的番种
    getFanTypes(): { name: string, fan: number }[] {
        const fanTypes = [];

        if (this.checkQingYiSe()) {
            fanTypes.push({ name: '清一色', fan: 24 });
        }
        if (this.checkHunYiSe()) {
            fanTypes.push({ name: '混一色', fan: 6 });
        }
        if (this.checkPengPengHu()) {
            fanTypes.push({ name: '碰碰和', fan: 6 });
        }
        if (this.checkDuanYaoJiu()) {
            fanTypes.push({ name: '断幺九', fan: 2 });
        }
        if (this.checkPingHu()) {
            fanTypes.push({ name: '平和', fan: 2 });
        }

        if (fanTypes.length === 0) {
            fanTypes.push({ name: '鸡胡', fan: 1 });
        }

        return fanTypes;
    }
}

export { HuPaiChecker };