export type HasLngLatProp = {
    lngLat: number[];
};

export type AddressProperties = {
    /**
     * The building number on the street.
     */
    streetNumber?: string;

    /**
     * The street name.
     */
    streetName?: string;

    /**
     * Sub / Super City
     */
    municipalitySubdivision?: string;

    /**
     * City / Town
     */
    municipality?: string;

    /**
     * County
     */
    countrySecondarySubdivision?: string;

    /**
     * Named Area
     */
    countryTertiarySubdivision?: string;

    /**
     * State or Province
     */
    countrySubdivision?: string;

    /**
     * Postal Code / Zip Code
     */
    postalCode?: string;

    /**
     * Extended postal code (availability dependent on region)
     */
    extendedPostalCode?: string;

    /**
     * Country (Note: This is a two-letter code, not a country name.)
     */
    countryCode?: string;

    /**
     * Country name
     */
    country?: string;

    /**
     * ISO alpha-3 country code
     */
    countryCodeISO3?: string;

    /**
     * An address line formatted according to formatting
     * rules of a result's country of origin, or in case
     * of countries its full country name.
     */
    freeformAddress?: string;

    /**
     * A full name of a first level of country administrative hierarchy.
     * This field appears only in case countrySubdivision is presented in an abbreviated form.
     * Supported only for USA, Canada and Great Britain.
     */
    countrySubdivisionName?: string;

    /**
     * An address component which represents the name of a geographic area or locality that groups a number of addressable objects for addressing purposes, without being an administrative unit.
     */
    localName?: string;
};

export type RevGeoAddressProps = HasLngLatProp & AddressProperties;
