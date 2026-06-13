import { waitHook } from '../../utils/wait-hook';

export async function extendBrush(): Promise<void> {
    const Brush = (await waitHook('Brush')).default;

    Brush.prototype.put_pixel = function (x: number, y: number, r: number, g: number, b: number, a: number): void {
        const ctx = this.ctx;
        const view = this.app.get_app().view;
        const center_x = view.width / 2;
        const center_y = view.height / 2;

        const imageData = ctx.createImageData(1, 1);
        const data = imageData.data;
        data[0] = r;
        data[1] = g;
        data[2] = b;
        data[3] = a;

        ctx.putImageData(imageData, center_x + x, center_y - y);
        this.actor.parent_scene.should_update_brush();
    };

    Brush.prototype.dataURL_stage = function (imgdata: ImageData): string {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        canvas.width = imgdata.width;
        canvas.height = imgdata.height;
        ctx.putImageData(imgdata, 0, 0);

        return canvas.toDataURL();
    };

    Brush.prototype.rectangle_clear = function (x: number, y: number, width: number, height: number): void {
        const ctx = this.ctx;
        const view = this.app.get_app().view;
        const center_x = view.width / 2;
        const center_y = view.height / 2;

        ctx.clearRect(center_x + x, center_y - y, width, height);
        this.actor.parent_scene.should_update_brush();
    };
}