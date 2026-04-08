/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as canvas from "../canvas.js";
import type * as chats from "../chats.js";
import type * as feedback from "../feedback.js";
import type * as files from "../files.js";
import type * as firecrawl from "../firecrawl.js";
import type * as lib_import_limits from "../lib/import_limits.js";
import type * as lib_plan from "../lib/plan.js";
import type * as messages from "../messages.js";
import type * as titleGenerator from "../titleGenerator.js";
import type * as users from "../users.js";
import type * as whitelist from "../whitelist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  canvas: typeof canvas;
  chats: typeof chats;
  feedback: typeof feedback;
  files: typeof files;
  firecrawl: typeof firecrawl;
  "lib/import_limits": typeof lib_import_limits;
  "lib/plan": typeof lib_plan;
  messages: typeof messages;
  titleGenerator: typeof titleGenerator;
  users: typeof users;
  whitelist: typeof whitelist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  firecrawlScrape: {
    lib: {
      deleteScrape: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { deletedFileCount: number; success: boolean }
      >;
      get: FunctionReference<
        "query",
        "internal",
        { id: string },
        null | {
          _creationTime: number;
          _id: string;
          error?: string;
          errorCode?: number | string;
          expiresAt: number;
          extractedJson?: any;
          extractedJsonFileId?: string;
          extractionSchema?: any;
          formats: Array<string>;
          html?: string;
          htmlFileId?: string;
          images?: Array<string>;
          imagesFileId?: string;
          links?: Array<string>;
          linksFileId?: string;
          markdown?: string;
          markdownFileId?: string;
          metadata?: {
            cacheControl?: string;
            contentType?: string;
            description?: string;
            language?: string;
            ogDescription?: string;
            ogImage?: string;
            ogSiteName?: string;
            ogTitle?: string;
            sourceURL?: string;
            statusCode?: number;
            title?: string;
          };
          normalizedUrl: string;
          rawHtml?: string;
          rawHtmlFileId?: string;
          scrapedAt?: number;
          scrapingAt?: number;
          screenshotFileId?: string;
          screenshotUrl?: string;
          startedAt: number;
          status: "pending" | "scraping" | "completed" | "failed";
          summary?: string;
          url: string;
          urlHash: string;
        }
      >;
      getByUrl: FunctionReference<
        "query",
        "internal",
        { url: string },
        null | {
          _creationTime: number;
          _id: string;
          error?: string;
          errorCode?: number | string;
          expiresAt: number;
          extractedJson?: any;
          extractedJsonFileId?: string;
          extractionSchema?: any;
          formats: Array<string>;
          html?: string;
          htmlFileId?: string;
          images?: Array<string>;
          imagesFileId?: string;
          links?: Array<string>;
          linksFileId?: string;
          markdown?: string;
          markdownFileId?: string;
          metadata?: {
            cacheControl?: string;
            contentType?: string;
            description?: string;
            language?: string;
            ogDescription?: string;
            ogImage?: string;
            ogSiteName?: string;
            ogTitle?: string;
            sourceURL?: string;
            statusCode?: number;
            title?: string;
          };
          normalizedUrl: string;
          rawHtml?: string;
          rawHtmlFileId?: string;
          scrapedAt?: number;
          scrapingAt?: number;
          screenshotFileId?: string;
          screenshotUrl?: string;
          startedAt: number;
          status: "pending" | "scraping" | "completed" | "failed";
          summary?: string;
          url: string;
          urlHash: string;
        }
      >;
      getCached: FunctionReference<
        "query",
        "internal",
        {
          formats?: Array<
            | "markdown"
            | "html"
            | "rawHtml"
            | "links"
            | "images"
            | "summary"
            | "screenshot"
          >;
          url: string;
        },
        null | {
          _creationTime: number;
          _id: string;
          error?: string;
          errorCode?: number | string;
          expiresAt: number;
          extractedJson?: any;
          extractedJsonFileId?: string;
          extractionSchema?: any;
          formats: Array<string>;
          html?: string;
          htmlFileId?: string;
          images?: Array<string>;
          imagesFileId?: string;
          links?: Array<string>;
          linksFileId?: string;
          markdown?: string;
          markdownFileId?: string;
          metadata?: {
            cacheControl?: string;
            contentType?: string;
            description?: string;
            language?: string;
            ogDescription?: string;
            ogImage?: string;
            ogSiteName?: string;
            ogTitle?: string;
            sourceURL?: string;
            statusCode?: number;
            title?: string;
          };
          normalizedUrl: string;
          rawHtml?: string;
          rawHtmlFileId?: string;
          scrapedAt?: number;
          scrapingAt?: number;
          screenshotFileId?: string;
          screenshotUrl?: string;
          startedAt: number;
          status: "pending" | "scraping" | "completed" | "failed";
          summary?: string;
          url: string;
          urlHash: string;
        }
      >;
      getContent: FunctionReference<
        "query",
        "internal",
        { id: string },
        null | {
          error?: string;
          errorCode?: number | string;
          expiresAt: number;
          extractedJson?: any;
          extractedJsonFileUrl?: string | null;
          formats: Array<string>;
          html?: string;
          htmlFileUrl?: string | null;
          images?: Array<string>;
          imagesFileUrl?: string | null;
          links?: Array<string>;
          linksFileUrl?: string | null;
          markdown?: string;
          markdownFileUrl?: string | null;
          metadata?: {
            cacheControl?: string;
            contentType?: string;
            description?: string;
            language?: string;
            ogDescription?: string;
            ogImage?: string;
            ogSiteName?: string;
            ogTitle?: string;
            sourceURL?: string;
            statusCode?: number;
            title?: string;
          };
          normalizedUrl: string;
          rawHtml?: string;
          rawHtmlFileUrl?: string | null;
          scrapedAt?: number;
          scrapingAt?: number;
          screenshotFileUrl?: string | null;
          screenshotUrl?: string;
          startedAt: number;
          status: "pending" | "scraping" | "completed" | "failed";
          summary?: string;
          url: string;
        }
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { id: string },
        null | {
          error?: string;
          errorCode?: number | string;
          expiresAt: number;
          scrapedAt?: number;
          scrapingAt?: number;
          startedAt: number;
          status: "pending" | "scraping" | "completed" | "failed";
        }
      >;
      invalidate: FunctionReference<
        "mutation",
        "internal",
        { url: string },
        { invalidatedCount: number; success: boolean }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          limit?: number;
          status?: "pending" | "scraping" | "completed" | "failed";
        },
        {
          hasMore: boolean;
          nextCursor: null | string;
          scrapes: Array<{
            _creationTime: number;
            _id: string;
            error?: string;
            errorCode?: number | string;
            expiresAt: number;
            extractedJson?: any;
            extractedJsonFileId?: string;
            extractionSchema?: any;
            formats: Array<string>;
            html?: string;
            htmlFileId?: string;
            images?: Array<string>;
            imagesFileId?: string;
            links?: Array<string>;
            linksFileId?: string;
            markdown?: string;
            markdownFileId?: string;
            metadata?: {
              cacheControl?: string;
              contentType?: string;
              description?: string;
              language?: string;
              ogDescription?: string;
              ogImage?: string;
              ogSiteName?: string;
              ogTitle?: string;
              sourceURL?: string;
              statusCode?: number;
              title?: string;
            };
            normalizedUrl: string;
            rawHtml?: string;
            rawHtmlFileId?: string;
            scrapedAt?: number;
            scrapingAt?: number;
            screenshotFileId?: string;
            screenshotUrl?: string;
            startedAt: number;
            status: "pending" | "scraping" | "completed" | "failed";
            summary?: string;
            url: string;
            urlHash: string;
          }>;
        }
      >;
      listByStatus: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          status: "pending" | "scraping" | "completed" | "failed";
        },
        Array<{
          _creationTime: number;
          _id: string;
          error?: string;
          errorCode?: number | string;
          expiresAt: number;
          extractedJson?: any;
          extractedJsonFileId?: string;
          extractionSchema?: any;
          formats: Array<string>;
          html?: string;
          htmlFileId?: string;
          images?: Array<string>;
          imagesFileId?: string;
          links?: Array<string>;
          linksFileId?: string;
          markdown?: string;
          markdownFileId?: string;
          metadata?: {
            cacheControl?: string;
            contentType?: string;
            description?: string;
            language?: string;
            ogDescription?: string;
            ogImage?: string;
            ogSiteName?: string;
            ogTitle?: string;
            sourceURL?: string;
            statusCode?: number;
            title?: string;
          };
          normalizedUrl: string;
          rawHtml?: string;
          rawHtmlFileId?: string;
          scrapedAt?: number;
          scrapingAt?: number;
          screenshotFileId?: string;
          screenshotUrl?: string;
          startedAt: number;
          status: "pending" | "scraping" | "completed" | "failed";
          summary?: string;
          url: string;
          urlHash: string;
        }>
      >;
      startScrape: FunctionReference<
        "mutation",
        "internal",
        {
          apiKey: string;
          options?: {
            excludeTags?: Array<string>;
            extractionSchema?: any;
            force?: boolean;
            formats?: Array<
              | "markdown"
              | "html"
              | "rawHtml"
              | "links"
              | "images"
              | "summary"
              | "screenshot"
            >;
            includeTags?: Array<string>;
            mobile?: boolean;
            onlyMainContent?: boolean;
            proxy?: "basic" | "stealth" | "auto";
            storeScreenshot?: boolean;
            ttlMs?: number;
            waitFor?: number;
          };
          url: string;
        },
        { jobId: string }
      >;
    };
  };
};
