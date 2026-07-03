# Cool Map Neckargemünd

**[Live Demo](https://kfg-gis-2026.github.io/web-map/)**

![cool-map](docs/images/Live_Demo.png)

The *Cool Map Neckargemünd* is an interactive web map developed as part of a university research project at the **University of Heidelberg**.  
The project focuses on identifying and visualizing cooling structures within the city of Neckargemünd — including shaded areas, green spaces, water points, and other relevant locations that contribute to heat mitigation and outdoor comfort.

The application is built using **MapLibre GL JS**, **OpenStreetMap data**, and an external data repository hosted on GitHub Pages.

---

## Data

All geospatial datasets used in this project (POIs, boundary polygons, icons) are maintained in a separate repository:

**[web-map-data](https://github.com/KFG-GIS-2026/web-map-data)** 

Separating code and data ensures a clean project structure and allows independent updates to the underlying datasets.

---

## Technologies

- **MapLibre GL JS** – interactive map rendering  
- **OpenFreeMap / OpenStreetMap** – basemap and geographic data (pois)  
- **GitHub Pages** – hosting for both the web map and the data repository
- **GRASS GIS r.sun** – solar radiation and shadow modelling used to compute hourly shadow rasters for the city area

---

## License

Data usage is subject to the respective licenses of the data providers.

