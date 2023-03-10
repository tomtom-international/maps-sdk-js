import { Places, SearchPlaceProps } from "@anw/go-sdk-js/core";
import { SearchSummary } from "../../shared";

export type GeometrySearchResponse = Places<SearchPlaceProps, GeometrySearchFeatureCollectionProps>;

export type GeometrySearchFeatureCollectionProps = SearchSummary;
