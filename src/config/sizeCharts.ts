import { Measurements } from "@/types";

export type GarmentType =
  | "Blouse"
  | "Kurti"
  | "Kurta Set"
  | "Coord Set"
  | "Dress/Gown"
  | "Bottom Wear"
  | "Lehenga"
  | "Custom";

export interface GarmentSizeChartConfig {
  garmentType: GarmentType;
  availableSizes: string[];
  isCoordSet?: boolean;
  relevantFields: (keyof Measurements)[];
  getMeasurements: (size: string, bottomSize?: string) => Partial<Measurements>;
}

// 1. Blouse Size Chart
export const BLOUSE_SIZE_CHART: Record<string, Partial<Measurements>> = {
  "32": { chest: 32, underBust: 28, waist: 26, shoulder: 13, armhole: 14, sleeveRound: 10, sleeve: 10, garmentLength: 13 },
  "34": { chest: 34, underBust: 30, waist: 28, shoulder: 13.5, armhole: 15, sleeveRound: 11, sleeve: 10, garmentLength: 13.5 },
  "36": { chest: 36, underBust: 32, waist: 30, shoulder: 14, armhole: 16, sleeveRound: 12, sleeve: 10.5, garmentLength: 14 },
  "38": { chest: 38, underBust: 34, waist: 32, shoulder: 14.5, armhole: 17, sleeveRound: 13, sleeve: 11, garmentLength: 14.5 },
  "40": { chest: 40, underBust: 36, waist: 34, shoulder: 15, armhole: 18, sleeveRound: 14, sleeve: 11, garmentLength: 15 },
  "42": { chest: 42, underBust: 38, waist: 36, shoulder: 15.5, armhole: 19, sleeveRound: 15, sleeve: 11.5, garmentLength: 15.5 },
  "44": { chest: 44, underBust: 40, waist: 38, shoulder: 16, armhole: 20, sleeveRound: 16, sleeve: 12, garmentLength: 16 },
  "46": { chest: 46, underBust: 42, waist: 40, shoulder: 16.5, armhole: 21, sleeveRound: 17, sleeve: 12, garmentLength: 16.5 },
  "48": { chest: 48, underBust: 44, waist: 42, shoulder: 17, armhole: 22, sleeveRound: 18, sleeve: 12.5, garmentLength: 17 },
};

// 2. Kurti / Kurta Set / Dress / Gown Size Chart
export const KURTI_SIZE_CHART: Record<string, Partial<Measurements>> = {
  "XS": { chest: 34, waist: 28, hip: 36, shoulder: 13.5, armhole: 15, sleeveRound: 11, sleeve: 18, garmentLength: 44 },
  "S": { chest: 36, waist: 30, hip: 38, shoulder: 14, armhole: 16, sleeveRound: 12, sleeve: 18, garmentLength: 44 },
  "M": { chest: 38, waist: 32, hip: 40, shoulder: 14.5, armhole: 17, sleeveRound: 13, sleeve: 18, garmentLength: 45 },
  "L": { chest: 40, waist: 34, hip: 42, shoulder: 15, armhole: 18, sleeveRound: 14, sleeve: 18, garmentLength: 45 },
  "XL": { chest: 42, waist: 36, hip: 44, shoulder: 15.5, armhole: 19, sleeveRound: 15, sleeve: 18, garmentLength: 46 },
  "XXL": { chest: 44, waist: 38, hip: 46, shoulder: 16, armhole: 20, sleeveRound: 16, sleeve: 18, garmentLength: 46 },
  "3XL": { chest: 46, waist: 40, hip: 48, shoulder: 16.5, armhole: 21, sleeveRound: 17, sleeve: 18, garmentLength: 47 },
  "4XL": { chest: 48, waist: 42, hip: 50, shoulder: 17, armhole: 22, sleeveRound: 18, sleeve: 18, garmentLength: 47 },
  "5XL": { chest: 50, waist: 44, hip: 52, shoulder: 17.5, armhole: 23, sleeveRound: 19, sleeve: 18, garmentLength: 48 },
};

// 3. Bottom Wear Size Chart
export const BOTTOM_WEAR_SIZE_CHART: Record<string, Partial<Measurements>> = {
  "26": { waist: 26, hip: 34, thigh: 21, knee: 15, bottomOpening: 12, inseam: 28, garmentLength: 38 },
  "28": { waist: 28, hip: 36, thigh: 22, knee: 16, bottomOpening: 13, inseam: 28, garmentLength: 38 },
  "30": { waist: 30, hip: 38, thigh: 23, knee: 17, bottomOpening: 14, inseam: 28, garmentLength: 39 },
  "32": { waist: 32, hip: 40, thigh: 24, knee: 18, bottomOpening: 15, inseam: 29, garmentLength: 39 },
  "34": { waist: 34, hip: 42, thigh: 25, knee: 19, bottomOpening: 16, inseam: 29, garmentLength: 40 },
  "36": { waist: 36, hip: 44, thigh: 26, knee: 20, bottomOpening: 17, inseam: 29, garmentLength: 40 },
  "38": { waist: 38, hip: 46, thigh: 27, knee: 21, bottomOpening: 18, inseam: 30, garmentLength: 41 },
  "40": { waist: 40, hip: 48, thigh: 28, knee: 22, bottomOpening: 19, inseam: 30, garmentLength: 41 },
  "42": { waist: 42, hip: 50, thigh: 29, knee: 23, bottomOpening: 20, inseam: 30, garmentLength: 42 },
  "44": { waist: 44, hip: 52, thigh: 30, knee: 24, bottomOpening: 21, inseam: 31, garmentLength: 42 },
};

// 4. Lehenga Size Chart
export const LEHENGA_SIZE_CHART: Record<string, Partial<Measurements>> = {
  "28": { waist: 28, hip: 36, garmentLength: 40, flair: "3.5 meters", canCan: "Included" },
  "30": { waist: 30, hip: 38, garmentLength: 40, flair: "3.8 meters", canCan: "Included" },
  "32": { waist: 32, hip: 40, garmentLength: 40, flair: "4.0 meters", canCan: "Included (Double Net)" },
  "34": { waist: 34, hip: 42, garmentLength: 40, flair: "4.0 meters", canCan: "Included (Double Net)" },
  "36": { waist: 36, hip: 44, garmentLength: 41, flair: "4.2 meters", canCan: "Included (Double Net)" },
  "38": { waist: 38, hip: 46, garmentLength: 41, flair: "4.2 meters", canCan: "Included (Heavy Net)" },
  "40": { waist: 40, hip: 48, garmentLength: 42, flair: "4.5 meters", canCan: "Included (Heavy Net)" },
  "42": { waist: 42, hip: 50, garmentLength: 42, flair: "4.5 meters", canCan: "Included (Heavy Net)" },
  "44": { waist: 44, hip: 52, garmentLength: 42, flair: "4.5 meters", canCan: "Included (Heavy Net)" },
};

export const GARMENT_SIZE_CONFIGS: Record<GarmentType, GarmentSizeChartConfig> = {
  "Blouse": {
    garmentType: "Blouse",
    availableSizes: ["32", "34", "36", "38", "40", "42", "44", "46", "48"],
    relevantFields: ["chest", "underBust", "waist", "shoulder", "armhole", "sleeveRound", "sleeve", "garmentLength"],
    getMeasurements: (size) => BLOUSE_SIZE_CHART[size] || {},
  },
  "Kurti": {
    garmentType: "Kurti",
    availableSizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"],
    relevantFields: ["chest", "waist", "hip", "shoulder", "armhole", "sleeveRound", "sleeve", "garmentLength"],
    getMeasurements: (size) => KURTI_SIZE_CHART[size] || {},
  },
  "Kurta Set": {
    garmentType: "Kurta Set",
    availableSizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"],
    relevantFields: ["chest", "waist", "hip", "shoulder", "armhole", "sleeveRound", "sleeve", "garmentLength"],
    getMeasurements: (size) => KURTI_SIZE_CHART[size] || {},
  },
  "Coord Set": {
    garmentType: "Coord Set",
    availableSizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"],
    isCoordSet: true,
    relevantFields: ["chest", "waist", "hip", "shoulder", "armhole", "sleeveRound", "sleeve", "thigh", "knee", "bottomOpening", "inseam", "garmentLength"],
    getMeasurements: (topSize, bottomSize) => {
      const top = KURTI_SIZE_CHART[topSize || "M"] || {};
      const bottom = BOTTOM_WEAR_SIZE_CHART[bottomSize || "30"] || {};
      return {
        chest: top.chest,
        shoulder: top.shoulder,
        armhole: top.armhole,
        sleeve: top.sleeve,
        sleeveRound: top.sleeveRound,
        waist: bottom.waist || top.waist,
        hip: bottom.hip || top.hip,
        thigh: bottom.thigh,
        knee: bottom.knee,
        bottomOpening: bottom.bottomOpening,
        inseam: bottom.inseam,
        garmentLength: top.garmentLength,
      };
    },
  },
  "Dress/Gown": {
    garmentType: "Dress/Gown",
    availableSizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"],
    relevantFields: ["chest", "waist", "hip", "shoulder", "armhole", "sleeveRound", "sleeve", "garmentLength"],
    getMeasurements: (size) => KURTI_SIZE_CHART[size] || {},
  },
  "Bottom Wear": {
    garmentType: "Bottom Wear",
    availableSizes: ["26", "28", "30", "32", "34", "36", "38", "40", "42", "44"],
    relevantFields: ["waist", "hip", "thigh", "knee", "bottomOpening", "inseam", "garmentLength"],
    getMeasurements: (size) => BOTTOM_WEAR_SIZE_CHART[size] || {},
  },
  "Lehenga": {
    garmentType: "Lehenga",
    availableSizes: ["28", "30", "32", "34", "36", "38", "40", "42", "44"],
    relevantFields: ["waist", "hip", "garmentLength"],
    getMeasurements: (size) => LEHENGA_SIZE_CHART[size] || {},
  },
  "Custom": {
    garmentType: "Custom",
    availableSizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"],
    relevantFields: ["chest", "underBust", "waist", "hip", "shoulder", "armhole", "sleeveRound", "sleeve", "garmentLength"],
    getMeasurements: (size) => KURTI_SIZE_CHART[size] || {},
  },
};
