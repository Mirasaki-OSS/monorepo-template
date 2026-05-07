import { SchemaObjectForm } from '@md-oss/design-system/components/forms/schema-object-form';
import { PageContainer } from '@md-oss/design-system/components/sections/page-container';
import { Callout } from '@md-oss/design-system/components/ui/extended/callout';
import React from 'react';
import z from 'zod/v4';

enum DiscordMagic {
  EMBED_TITLE_MAX = 256,
  EMBED_DESCRIPTION_MAX = 4096,
  EMBED_FIELD_NAME_MAX = 256,
  EMBED_FIELD_VALUE_MAX = 1024,
  EMBED_FIELDS_MAX = 25,
  EMBED_FOOTER_MAX = 2048,
  EMBED_AUTHOR_MAX = 256,
  EMBED_PROVIDER_MAX = 256,
  EMBED_TOTAL_MAX = 6000,
  MESSAGE_EMBEDS_MAX = 10,
}

const hexColorSchema = z.string().regex(/^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/);

/**
 * @see {@link https://discord.com/developers/docs/resources/message#embed-object-embed-types}
 */
enum EmbedType {
  /**
   * Generic embed rendered from embed attributes
   */
  Rich = 'rich',
  /**
   * Image embed
   */
  Image = 'image',
  /**
   * Video embed
   */
  Video = 'video',
  /**
   * Animated gif image embed rendered as a video embed
   */
  GIFV = 'gifv',
  /**
   * Article embed
   */
  Article = 'article',
  /**
   * Link embed
   */
  Link = 'link',
  /**
   * Auto moderation alert embed
   *
   * @unstable This embed type is currently not documented by Discord, but it is returned in the auto moderation system messages.
   */
  AutoModerationMessage = 'auto_moderation_message',
  /**
   * Poll result embed
   */
  PollResult = 'poll_result',
}

const discordEmbedColorSchema = hexColorSchema.describe(
  'Color in hexadecimal format (e.g., #FF5733). Displayed as a colored strip on the left side of the embed.'
);

const discordEmbedThumbnailSchema = z
  .object({
    url: z
      .url()
      .describe(
        'Image URL for the small thumbnail shown in the top-right of the embed.'
      ),
    width: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Known width of the thumbnail in pixels.'),
    height: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Known height of the thumbnail in pixels.'),
  })
  .describe(
    'Optional thumbnail to display in the top-right side of the embed. Can be used to provide a small preview image related to the embed content.'
  );

const discordEmbedFooterSchema = z
  .object({
    text: z
      .string()
      .describe('Footer text shown at the bottom of the embed.')
      .max(
        DiscordMagic.EMBED_FOOTER_MAX,
        `Footer text exceeds the Discord limit of ${DiscordMagic.EMBED_FOOTER_MAX} characters.`
      ),
    icon_url: z
      .url()
      .optional()
      .describe('Optional icon URL displayed next to the footer text.'),
  })
  .describe(
    'Optional footer to display at the bottom of the embed. Can be used for additional context or information about the embed content.'
  );

const discordEmbedFieldSchema = z
  .object({
    name: z
      .string()
      .describe('Field label shown above the field value.')
      .max(
        DiscordMagic.EMBED_FIELD_NAME_MAX,
        `Field name exceeds the Discord limit of ${DiscordMagic.EMBED_FIELD_NAME_MAX} characters.`
      ),
    value: z
      .string()
      .describe('Field body text; supports markdown-like Discord formatting.')
      .max(
        DiscordMagic.EMBED_FIELD_VALUE_MAX,
        `Field value exceeds the Discord limit of ${DiscordMagic.EMBED_FIELD_VALUE_MAX} characters.`
      ),
    inline: z
      .boolean()
      .optional()
      .describe('Render this field in the same row as other inline fields.'),
  })
  .describe(
    'Field(s) to display in the Discord embed. Can be used to present additional information in a structured format within the embed.'
  );

const discordEmbedProviderSchema = z
  .object({
    name: z
      .string()
      .describe(
        'Source/provider name shown above the author line, when present.'
      )
      .max(
        DiscordMagic.EMBED_PROVIDER_MAX,
        `Provider name exceeds the Discord limit of ${DiscordMagic.EMBED_PROVIDER_MAX} characters.`
      ),
    url: z.url().describe('Canonical link for the provider/source.'),
  })
  .describe(
    'Optional provider to display at the top of the embed, above the author. Can be used to indicate the source of the embed content.'
  );

const discordEmbedAuthorSchema = z
  .object({
    name: z
      .string()
      .describe(
        'Display name shown in the author row near the top of the embed.'
      )
      .max(
        DiscordMagic.EMBED_AUTHOR_MAX,
        `Author name exceeds the Discord limit of ${DiscordMagic.EMBED_AUTHOR_MAX} characters.`
      ),
    url: z
      .url()
      .optional()
      .describe('Link opened when the author name is clicked.'),
    icon_url: z
      .url()
      .optional()
      .describe('Avatar/icon URL displayed before the author name.'),
  })
  .describe(
    'Optional author to display at the top of the embed, above the title - but underneath the provider. Can be used to indicate the creator of the embed content.'
  );

const discordEmbedImageSchema = z
  .object({
    url: z
      .url()
      .describe('Image URL rendered in the main media area of the embed body.'),
    width: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Known width of the image in pixels.'),
    height: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Known height of the image in pixels.'),
  })
  .describe(
    'Optional image to display in the main body of the embed. Can be used to provide a large visual element related to the embed content. Rendered below the description and fields, and above the footer.'
  );

const discordEmbedSchemaBase = z.object({
  title: z
    .string()
    .max(
      DiscordMagic.EMBED_TITLE_MAX,
      `Embed title exceeds the Discord limit of ${DiscordMagic.EMBED_TITLE_MAX} characters.`
    )
    .optional()
    .nullable()
    .describe('Title of the Discord embed message.'),
  description: z
    .string()
    .max(
      DiscordMagic.EMBED_DESCRIPTION_MAX,
      `Embed description exceeds the Discord limit of ${DiscordMagic.EMBED_DESCRIPTION_MAX} characters.`
    )
    .optional()
    .nullable()
    .describe('Description text of the Discord embed message.'),
  color: discordEmbedColorSchema
    .optional()
    .nullable()
    .describe(
      'Color of the Discord embed in hexadecimal format (e.g., #FF5733).'
    ),
  url: z
    .url()
    .optional()
    .nullable()
    .describe('Primary URL associated with the embed title or content.'),
  timestamp: z
    .string()
    .optional()
    .nullable()
    .describe('ISO 8601 timestamp displayed in the embed footer area.'),
  type: z
    .enum([
      EmbedType.Rich,
      EmbedType.Image,
      EmbedType.Video,
      EmbedType.Article,
      EmbedType.Link,
    ])
    .optional()
    .describe(
      'Embed render type. Use rich for custom embeds sent by bots/webhooks.'
    ),
});

const _discordEmbedSchema = discordEmbedSchemaBase
  .extend({
    thumbnail: discordEmbedThumbnailSchema.optional(),
    footer: discordEmbedFooterSchema.optional(),
    fields: z
      .array(discordEmbedFieldSchema)
      .max(
        DiscordMagic.EMBED_FIELDS_MAX,
        `A Discord embed can have at most ${DiscordMagic.EMBED_FIELDS_MAX} fields.`
      )
      .optional()
      .describe(
        'Optional array of fields to display in the embed. Fields are displayed in the order they are provided.'
      ),
    provider: discordEmbedProviderSchema.optional(),
    author: discordEmbedAuthorSchema.optional(),
    image: discordEmbedImageSchema.optional(),
  })
  .describe('Schema for validating Discord embed objects.');

type DiscordEmbed = z.infer<typeof _discordEmbedSchema>;

const getTotalEmbedCharacters = (data: DiscordEmbed): number => {
  const titleLength = data.title?.length ?? 0;
  const descriptionLength = data.description?.length ?? 0;
  const fieldsLength = data.fields
    ? data.fields.reduce(
        (acc, field) => acc + field.name.length + field.value.length,
        0
      )
    : 0;
  const footerLength = data.footer?.text.length ?? 0;
  const authorLength = data.author?.name.length ?? 0;
  const providerLength = data.provider?.name.length ?? 0;

  return (
    titleLength +
    descriptionLength +
    fieldsLength +
    footerLength +
    authorLength +
    providerLength
  );
};

const discordEmbedMaxCharactersRefinement = (
  data: z.infer<typeof _discordEmbedSchema>
) => {
  const maxChars = DiscordMagic.EMBED_TOTAL_MAX;
  return getTotalEmbedCharacters(data) <= maxChars;
};

const discordEmbedSchema = _discordEmbedSchema.refine(
  discordEmbedMaxCharactersRefinement,
  {
    message: `Embed text content exceeds the Discord limit of ${DiscordMagic.EMBED_TOTAL_MAX} characters.`,
  }
);

const discordEmbedsMaxCharactersRefinement = (
  embeds: z.infer<typeof discordEmbedSchema>[]
) => {
  const maxChars = DiscordMagic.EMBED_TOTAL_MAX;
  const totalChars = embeds.reduce(
    (acc, embed) => acc + getTotalEmbedCharacters(embed),
    0
  );
  return totalChars <= maxChars;
};

const discordEmbedsSchema = z
  .array(discordEmbedSchema)
  .max(
    DiscordMagic.MESSAGE_EMBEDS_MAX,
    `A message can include at most ${DiscordMagic.MESSAGE_EMBEDS_MAX} embeds.`
  )
  .refine(discordEmbedsMaxCharactersRefinement, {
    message: `Combined embed text content exceeds the Discord limit of ${DiscordMagic.EMBED_TOTAL_MAX} characters.`,
  })
  .describe('Array of Discord embed objects.');

const discordEmbedSchemaWithChildren = discordEmbedSchema.extend({
  children: z.array(discordEmbedsSchema).optional(),
});

const cftoolsLeaderboardSortSchema = z.enum([
  'kills',
  'deaths',
  'kd',
  'playtime',
]);
const cftoolsLeaderboardStatSchema = z.enum([
  'kills',
  'deaths',
  'kd',
  'playtime',
  'longest_kill',
]);

const defaultLeaderboardSort = 'kd';
const defaultLeaderboardStat = 'kd';

const discordIntegrationOutputStyleSchema = z.enum([
  'detailed',
  'compact',
  'plain',
]);
const discordSnowflakeSchema = z
  .string()
  .regex(/^\d{17,19}$/)
  .describe(
    'A valid Discord snowflake ID, which is a string of 17 to 19 digits.'
  );
const discordWebhookUrlSchema = z
  .string()
  .url()
  .regex(
    /^https:\/\/(canary\.|ptb\.)?discord\.com\/api\/webhooks\/\d{17,19}\/[\w-]+$/
  )
  .describe(
    'A valid Discord webhook URL, which must match the pattern https://discord.com/api/webhooks/{webhook.id}/{webhook.token} (with optional canary. or ptb. subdomain).'
  );

const discordIntegrationSchema = z.object({
  defaultSort: cftoolsLeaderboardSortSchema
    .default(defaultLeaderboardSort)
    .describe(
      `Default sorting method for the leaderboard. Must be one of the following values: ${cftoolsLeaderboardSortSchema.options.join(', ')}. Default is ${defaultLeaderboardSort}.`
    ),
  defaultStatistic: cftoolsLeaderboardStatSchema
    .default(defaultLeaderboardStat)
    .describe(
      `Default statistic to rank/sort leaderboard by. Must be one of the following values: ${cftoolsLeaderboardStatSchema.options.join(', ')}. Default is ${defaultLeaderboardStat}.`
    ),
  playerLimit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10)
    .describe(
      'Number of top players to include in leaderboard output. Must be between 1 and 100. Default is 10. Clamped to 25 max if DiscordIntegration#style is not "plain" due to Discord embed field limits.'
    ),
  sortOptions: z
    .array(cftoolsLeaderboardStatSchema)
    .default(cftoolsLeaderboardStatSchema.options)
    .describe(
      `List of available sorting options to include in the leaderboard output. Must be an array containing any of the following values: ${cftoolsLeaderboardStatSchema.options.join(', ')}. Default is all options.`
    ),
  discordIntegration: z
    .object({
      style: discordIntegrationOutputStyleSchema
        .default('detailed')
        .describe(
          'Style/format of the Discord message output, either "detailed", "compact", or "plain". Detailed style includes more information such as playtime and longest kill, compact style only displays kills, deaths, and K/D ratio, and plain style provides a minimalistic output (only current statistic values and player names, plain message - no embeds). Default is "detailed".'
        ),
      channelPublisher: z
        .object({
          enabled: z
            .boolean()
            .default(false)
            .describe(
              'If configured, the module will post an update message to the specified channel every hour.'
            ),
          channelId: discordSnowflakeSchema
            .nullable()
            .default(null)
            .describe(
              'Discord channel ID to post leaderboard updates to. If configured, the module will post an update message to this channel every hour.'
            ),
          guildId: discordSnowflakeSchema
            .nullable()
            .default(null)
            .describe(
              'Discord guild/server ID where the channel to post updates to is located. Required if channelId is set.'
            ),
          botToken: z
            .string()
            .min(1)
            .nullable()
            .default(null)
            .describe(
              'Discord bot token to post leaderboard updates with. Required if channelId is set.'
            ),
        })
        .nullable()
        .refine(
          (value) =>
            !value ||
            (value.enabled &&
              value.channelId &&
              value.guildId &&
              value.botToken) ||
            !value.enabled,
          'Channel Id, Guild Id, and Bot Token are required when channelPublisher integration is enabled'
        )
        .default(null)
        .describe(
          'Publishes leaderboard updates to a specified Discord channel every hour. Requires a bot token with permissions to post messages to the target channel.'
        ),
      webhookPublisher: z
        .object({
          enabled: z
            .boolean()
            .default(false)
            .describe(
              'If configured, the module will post an update message to the specified webhook every hour.'
            ),
          webhookUrl: discordWebhookUrlSchema
            .nullable()
            .default(null)
            .describe(
              'Discord webhook URL to post leaderboard updates to. If configured, the module will post an update message to this webhook every hour.'
            ),
        })
        .nullable()
        .refine(
          (value) =>
            !value || (value.enabled && value.webhookUrl) || !value.enabled,
          'Webhook Url is required when webhook integration is enabled'
        )
        .default(null)
        .describe(
          'Publishes leaderboard updates to a specified Discord webhook every hour.'
        ),
      embedConfiguration: discordEmbedSchema
        .optional()
        .nullable()
        .default(null)
        .describe(
          'Custom configuration for the Discord embed used to publish leaderboard updates. If not set, a default embed configuration will be used.'
        ),
    })
    .nullable()
    .default(null)
    .describe(
      'Optional Discord configuration, integrates the leaderboard with your community Discord server.'
    ),
  websiteIntegration: z
    .object({
      enabled: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          'If enabled, a public leaderboard page will be exposed on the Grid 00 website. The page will be accessible at /leaderboard/{guildId}?serverId={serverId} and will display the latest leaderboard data for the specified server.'
        ),
      page: z
        .object({
          title: z
            .string()
            .optional()
            .nullable()
            .default(null)
            .describe(
              'Title of the page when current server is being displayed.'
            ),
          description: z
            .string()
            .optional()
            .nullable()
            .default(null)
            .describe(
              'Optional description text to display on the page when current server is being displayed.'
            ),
          themeColor: hexColorSchema
            .optional()
            .nullable()
            .default(null)
            .describe(
              'Optional theme/accent color to use for the page when current server is being displayed.'
            ),
          backgroundImageUrl: z
            .url()
            .optional()
            .nullable()
            .default(null)
            .describe(
              'Optional background image URL to use for the page when current server is being displayed.'
            ),
          noDataMessage: z
            .string()
            .optional()
            .nullable()
            .default('No leaderboard data available yet.')
            .describe(
              'Message to display on the page when there is no leaderboard data available for the current server.'
            ),
          errorMessage: z
            .string()
            .optional()
            .nullable()
            .default('Error fetching leaderboard, current data may be stale.')
            .describe(
              'Message to display on the page when there is an error fetching the leaderboard data for the current server.'
            ),
        })
        .optional()
        .nullable()
        .default(null)
        .describe('Configuration for the page exposed on the Grid 00 website.'),
    })
    .optional()
    .nullable()
    .default(null)
    .describe(
      'Optional website integration configuration, exposes a public leaderboard page on the Grid 00 website when enabled.'
    ),
  blacklist: z
    .object({
      playerNames: z
        .array(z.string().min(1).max(100))
        .min(0)
        .max(100)
        .default([]),
      cftoolsIds: z.array(z.uuid()).min(0).max(100).default([]),
    })
    .nullable()
    .default(null)
    .describe(
      'Optional blacklist to exclude specific players from leaderboard output. Can include any combination of the following fields: playerNames (array of in-game player names), cftoolsIds (array of cftools user IDs). Players matching any of the specified identifiers will be excluded from the leaderboard.'
    ),
});

export default function SchemaObjectFormTest() {
  const [value, setValue] = React.useState<
    z.infer<typeof discordEmbedSchemaWithChildren>
  >({
    type: EmbedType.Rich,
  });
  const [discordIntegrationValue, setDiscordIntegrationValue] = React.useState<
    z.infer<typeof discordIntegrationSchema>
  >({
    blacklist: {
      cftoolsIds: [],
      playerNames: [],
    },
    defaultSort: defaultLeaderboardSort,
    defaultStatistic: defaultLeaderboardStat,
    discordIntegration: null,
    playerLimit: 10,
    sortOptions: cftoolsLeaderboardStatSchema.options,
    websiteIntegration: null,
  });
  return (
    <PageContainer
      slotProps={{
        container: { asComponent: 'main' },
      }}
      className="flex flex-col gap-4"
    >
      <Callout variant="info">
        This is a test page. It does not serve any real purpose and is only here
        for testing the layout and components.
      </Callout>
      <Callout variant="success">
        This is a test page. It does not serve any real purpose and is only here
        for testing the layout and components.
      </Callout>
      <Callout variant="warning">
        This is a test page. It does not serve any real purpose and is only here
        for testing the layout and components.
      </Callout>
      <Callout variant="error">
        This is a test page. It does not serve any real purpose and is only here
        for testing the layout and components.
      </Callout>

      <SchemaObjectForm
        schema={discordIntegrationSchema}
        value={discordIntegrationValue}
        onChange={(data) =>
          setDiscordIntegrationValue(
            data as z.infer<typeof discordIntegrationSchema>
          )
        }
        className="max-w-2xl w-full"
      />

      <SchemaObjectForm
        schema={discordEmbedSchemaWithChildren}
        value={value}
        onChange={(data) =>
          setValue(data as z.infer<typeof discordEmbedSchemaWithChildren>)
        }
        className="max-w-2xl w-full"
      />
    </PageContainer>
  );
}
