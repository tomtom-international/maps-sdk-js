
import { TomTomConfig } from "@cet/maps-sdk-js/core";
import {
  HillshadeModule,
  POIsModule,
  PublishedStyleID,
  publishedStyleIDs,
  TomTomMap,
  TrafficFlowModule,
  TrafficIncidentsModule,
} from "@cet/maps-sdk-js/map";

// TomTomConfig initialization
(() => {
  TomTomConfig.instance.put({
    apiKey: process.env.API_KEY_EXAMPLES,
    language: "en-GB",
  });
})();

// Main map and modules initialization
(async () => {
  const map = new TomTomMap(
    { container: "map", zoom: 14, minZoom: 2, center: [-0.12621, 51.50394] },
    {
      style: {
        type: "published",
        include: ["trafficIncidents", "trafficFlow", "hillshade"],
      },
    }
  );

  // Traffic Incidents and Flow
  (async () => {
    const incidents = await TrafficIncidentsModule.get(map);
    const flow = await TrafficFlowModule.get(map);
    document.querySelector("#toggleTraffic")?.addEventListener("click", () => {
      incidents.setVisible(!incidents.isVisible());
      flow.setVisible(!flow.isVisible());
    });
    document
      .querySelector("#toggleIncidents")
      ?.addEventListener("click", () =>
        incidents.setVisible(!incidents.isVisible())
      );
    document
      .querySelector("#toggleIncidentIcons")
      ?.addEventListener("click", () =>
        incidents.setIconsVisible(!incidents.anyIconLayersVisible())
      );
    document
      .querySelector("#toggleFlow")
      ?.addEventListener("click", () => flow.setVisible(!flow.isVisible()));
  })();

  // POIs
  (async () => {
    const pois = await POIsModule.get(map);
    document
      .querySelector("#togglePOIs")
      ?.addEventListener("click", () => pois.setVisible(!pois.isVisible()));
  })();

  // Hillshade
  (async () => {
    const hillshade = await HillshadeModule.get(map);
    document
      .querySelector("#toggleHillshade")
      ?.addEventListener("click", () =>
        hillshade.setVisible(!hillshade.isVisible())
      );
  })();

  // Styles selector
  (() => {
    const stylesSelector = document.querySelector(
      "#mapStyles"
    ) as HTMLSelectElement;
    publishedStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener("change", (event) =>
      map.setStyle((event.target as HTMLOptionElement).value as PublishedStyleID)
    );
  })();

  (window as any).map = map; // This has been done for automation test support
})();
