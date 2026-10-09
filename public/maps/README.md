# 地球仪地图数据

`world.json` 为 Natural Earth 的 1:110m 国家多边形数据，去除属性并将坐标保留两位小数，用于个人足迹地球仪的背景展示。

来源：https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson

Natural Earth 数据属于公有领域：https://www.naturalearthdata.com/about/terms-of-use/

城市标记单独维护在 `src/data/personal.ts`，不依赖国家边界数据。
