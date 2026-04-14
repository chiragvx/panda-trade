import axios from 'axios';

const API_BASE = '/api/worldbank';

export interface WorldBankDataPoint {
  OBS_VALUE: string;
  TIME_PERIOD: string;
  INDICATOR: string;
  REF_AREA: string;
  SEX?: string;
  FREQ?: string;
  UNIT_MEASURE?: string;
  LATEST_DATA?: boolean;
}

export interface WorldBankResponse {
  count: number;
  value: WorldBankDataPoint[];
}

export interface IndicatorMeta {
  series_description: {
    idno: string;
    name: string;
    database_id: string;
    topics?: { name: string }[];
  }
}

export interface SearchResponse {
  count?: number;
  value: IndicatorMeta[];
}

/**
 * Fetches time-series data for a given indicator
 */
export async function fetchIndicatorData(
  databaseId: string,
  indicatorId: string,
  refArea?: string,
  from?: string,
  to?: string,
  skip: number = 0
): Promise<WorldBankResponse> {
  const params: Record<string, any> = {
    DATABASE_ID: databaseId,
    INDICATOR: indicatorId,
    skip,
    format: 'json',
  };

  if (refArea) params.REF_AREA = refArea;
  if (from) params.timePeriodFrom = from;
  if (to) params.timePeriodTo = to;

  try {
    const res = await axios.get<WorldBankResponse>(`${API_BASE}/data`, { params });
    return res.data;
  } catch (error) {
    console.error('Failed to fetch World Bank data:', error);
    throw error;
  }
}

/**
 * Perform a semantic search for indicators
 */
export async function searchIndicators(
  keyword: string,
  top: number = 50,
  skip: number = 0
): Promise<IndicatorMeta[]> {
  try {
    const res = await axios.post<{ value: IndicatorMeta[] }>(`${API_BASE}/searchv2`, {
      count: false,
      search: keyword,
      select: 'series_description/idno, series_description/name, series_description/database_id',
      filter: "type eq 'indicator'",
      top,
      skip,
    });
    return res.data.value;
  } catch (error) {
    console.error('Failed to search World Bank indicators:', error);
    throw error;
  }
}

/**
 * Fetch latest commodity prices
 */
export async function fetchCommodities(skip: number = 0): Promise<WorldBankResponse> {
    const params: Record<string, any> = {
        DATABASE_ID: 'WB_CMDTS',
        isLatestData: true,
        skip,
        format: 'json',
    };
    
    try {
        const res = await axios.get<WorldBankResponse>(`${API_BASE}/data`, { params });
        return res.data;
    } catch (error) {
        console.error('Failed to fetch commodities:', error);
        throw error;
    }
}

/**
 * Fetch all entities (countries, regions, etc) from standard WB API
 */
export async function fetchAllEntities(): Promise<{ id: string; name: string; iso3: string }[]> {
    try {
        const res = await axios.get<any[]>(`https://api.worldbank.org/v2/country`, {
            params: { format: 'json', per_page: 300 }
        });
        // Standard WB API returns [metadata, data]
        if (Array.isArray(res.data) && res.data[1]) {
            return res.data[1].map((v: any) => ({
                id: v.id,
                name: v.name,
                iso3: v.id 
            }));
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch entities:', error);
        return [];
    }
}
