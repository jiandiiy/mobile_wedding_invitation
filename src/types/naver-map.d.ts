export {};

declare global {
  interface Window {
    naver: {
      maps: {
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Map: new (
          container: HTMLElement,
          options: {
            center: NaverLatLng;
            zoom: number;
            minZoom?: number;
            maxZoom?: number;
            scrollWheel?: boolean;
            draggable?: boolean;
            pinchZoom?: boolean;
            mapDataControl?: boolean;
            scaleControl?: boolean;
            logoControl?: boolean;
            mapTypeControl?: boolean;
            zoomControl?: boolean;
          },
        ) => NaverMap;
        Marker: new (options: {
          position: NaverLatLng;
          map: NaverMap;
        }) => NaverMarker;
      };
    };
  }

  type NaverLatLng = object;
  type NaverMap = object;
  type NaverMarker = object;
}