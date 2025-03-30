const { ccclass, property } = cc._decorator;
import { UITransform, sp } from 'cc';

@ccclass
export default class Monster extends cc.Component {
    @property
    hp: number = 100;

    @property
    speed: number = 100;

    @property
    attack: number = 10;

    private spine: sp.Skeleton = null;

    onLoad() {
        // 获取 Spine 组件
        this.spine = this.node.getComponent(sp.Skeleton);
        if (this.spine) {
            // 设置默认动画
            this.spine.setAnimation(0, 'idle', true);
        } else {
            console.error('Spine component not found on monster node.');
        }

        // 获取UITransform组件
        const uiTransform = this.node.getComponent(UITransform);
        if (uiTransform) {
            // 设置怪物在屏幕最右侧生成
            this.node.setPosition(cc.winSize.width + uiTransform.width / 2, Math.random() * cc.winSize.height - cc.winSize.height / 2);
            console.log(`Monster created at position: ${this.node.position}`);
        } else {
            console.error('UITransform component not found on monster node.');
        }
    }

    start() {
        console.log(`Monster start method called.`);
    }

    update(dt) {
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            console.error('UITransform component not found on monster node.');
            return;
        }

        // 确保 update() 方法被调用
        console.log(`Monster is updating. dt=${dt}, speed=${this.speed}, current position: (${this.node.position.x}, ${this.node.position.y})`);
        
        // 让怪物向左移动
        const newX = this.node.position.x - this.speed * dt;
        this.node.setPosition(newX, this.node.position.y);
        
        // 确保位置更新
        console.log(`Monster new position: (${this.node.position.x}, ${this.node.position.y})`);
        
        // 如果怪物移出屏幕左侧，则销毁该节点
        if (this.node.position.x < -cc.winSize.width / 2 - uiTransform.width / 2) {
            this.node.destroy();
            console.log(`Monster destroyed.`);
        }
    }

    playAnimation(animationName: string, loop: boolean) {
        if (this.spine) {
            this.spine.setAnimation(0, animationName, loop);
        }
    }
}