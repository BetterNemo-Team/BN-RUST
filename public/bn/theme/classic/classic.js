Theme.metaData = {
    "name": "怀旧",
    "author": "Codemao(tL7fK5sT.sb 还原)",
    "description": "OldNemo的默认主题,关闭背景图片以获得最佳体验",
    "version": "1.0.0"
};
const config = storage.get('theme_config');
const presetBackgroundImage = 'http://youke.xn--y7xa690gmna.cn/s1/2026/01/25/697632d161f0a.webp';
const presetBackgroundColor = "#221D4E";
if (config['classic'] == true){
    storage.set('backgroundImage', ' ');
    storage.set('backgroundColor', '#323845');
} else {
    storage.set('backgroundImage', presetBackgroundImage);
    storage.set('backgroundColor', presetBackgroundColor);
}
