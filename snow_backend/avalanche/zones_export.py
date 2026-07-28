# @atlas: zones.geojson exporter: vectorizes the zone label raster (rasterio.features.shapes, EPSG:31254) with per-zone stats properties, plus a stats block (count, area percentiles) printed and embedded.
import json

import numpy as np
import rasterio.features

from . import config, gate, terrain


def export(out_path=None):
    t = terrain.prepare()
    labels, zones = gate.build()
    out_path = out_path or (config.WORK_DIR / "zones.geojson")

    by_id = {z["id"]: z for z in zones}
    features = []
    for geom, zid in rasterio.features.shapes(
        labels.astype(np.int32), mask=labels > 0, transform=t["transform"]
    ):
        z = by_id[int(zid)]
        features.append(
            dict(
                type="Feature",
                geometry=geom,
                properties=dict(
                    id=z["id"], area_ha=round(z["area_ha"], 2),
                    z_mean=round(z["z_mean"], 0), z_max=round(z["z_max"], 0),
                    slope_mean=round(z["slope_mean"], 1),
                ),
            )
        )

    areas = np.array([z["area_ha"] for z in zones])
    stats = dict(
        zone_count=len(zones),
        area_ha_total=round(float(areas.sum()), 1),
        area_ha_p10_p50_p90=[round(float(v), 1) for v in np.percentile(areas, [10, 50, 90])],
        over_60ha=int((areas > 60).sum()),
        crs="EPSG:31254",
        note="full mosaic incl. 4 km reach margin; ~1/3 of zones sit inside the 197-tile beta footprint",
    )
    fc = dict(type="FeatureCollection",
              crs=dict(type="name", properties=dict(name="EPSG:31254")),
              stats=stats, features=features)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(fc))
    print(json.dumps(stats, indent=1))
    print(f"wrote {out_path} ({len(features)} polygons)")
    return stats


if __name__ == "__main__":
    export()
