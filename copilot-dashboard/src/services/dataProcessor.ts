import type {
  RawReportData,
  ProcessedData,
  ApplicationData,
  BranchData,
  UserData,
  CommitData,
  FileTypeData,
  SummaryData,
  TierData,
  UserApplicationStats,
} from '../types';
import { calculateAIPercentage, calculateHumanValue } from '../utils/calculations';

/**
 * Calculate tier based on AI percentage
 */
const getTierFromPercentage = (aiPercentage: number): number => {
  if (aiPercentage >= 81) return 5;
  if (aiPercentage >= 61) return 4;
  if (aiPercentage >= 41) return 3;
  if (aiPercentage >= 21) return 2;
  return 1;
};

/**
 * Process raw report data into a format suitable for the dashboard
 * Supports both the old format and the new consolidated format with "data" array
 */
export const processReportData = (rawData: RawReportData): ProcessedData => {
  const applications: ApplicationData[] = [];
  const branches: BranchData[] = [];
  const users: Record<string, UserData> = {};
  const commits: CommitData[] = [];
  const fileTypes: FileTypeData[] = [];
  
  // Summary accumulators
  let totalCommits = 0;
  let aiCommits = 0;
  let totalLines = 0;
  let aiLines = 0;
  const contributorSet = new Set<string>();
  const applicationSet = new Set<string>();
  const tiers: TierData = { tier1: 0, tier2: 0, tier3: 0, tier4: 0, tier5: 0 };

  // Check for consolidated "data" array format (new format)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataArray = (rawData as any).data;
  if (dataArray && Array.isArray(dataArray)) {
    for (const appData of dataArray) {
      const appName = appData.ApplicationName || 'Unknown';
      const branch = appData.Branch || 'main';
      applicationSet.add(appName);

      // Process commits
      let appTotalCommits = 0;
      let appAICommits = 0;
      let appTotalLines = 0;
      let appAILines = 0;
      const appContributors = new Set<string>();
      const appTiers: TierData = { tier1: 0, tier2: 0, tier3: 0, tier4: 0, tier5: 0 };

      if (appData.Commits && Array.isArray(appData.Commits)) {
        for (const c of appData.Commits) {
          // Skip commits with null/empty author
          const author = c.Author?.trim();
          if (!author || author === 'null' || author === 'Unknown' || author === '') {
            continue;
          }

          const commitData: CommitData = {
            hash: c.Hash || '',
            author: author,
            date: c.Date || '',
            message: c.Message || '',
            linesAdded: c.LinesAdded || 0,
            isAI: c.IsAI || false,
            confidenceScore: c.ConfidenceScore || 0,
            tierNumber: c.TierNumber || 0,
            application: appName,
          };
          commits.push(commitData);
          contributorSet.add(author);
          appContributors.add(author);

          // Build user data from commits (like original HTML dashboard)
          if (!users[author]) {
            users[author] = {
              name: author,
              totalCommits: 0,
              aiCommits: 0,
              humanCommits: 0,
              totalLines: 0,
              aiLines: 0,
              humanLines: 0,
              aiPercentage: 0,
              applications: {},
            };
          }

          const user = users[author];
          
          // Track per-application stats for this user
          if (!user.applications[appName]) {
            user.applications[appName] = {
              totalCommits: 0,
              aiCommits: 0,
              totalLines: 0,
              aiLines: 0,
            };
          }
          
          const appStats = user.applications[appName] as UserApplicationStats;
          appStats.totalCommits++;
          appStats.totalLines += c.LinesAdded || 0;
          
          if (c.IsAI) {
            appStats.aiCommits++;
            appStats.aiLines += c.LinesAdded || 0;
          }
          
          // Update user totals
          user.totalCommits++;
          user.totalLines += c.LinesAdded || 0;
          if (c.IsAI) {
            user.aiCommits++;
            user.aiLines += c.LinesAdded || 0;
          } else {
            user.humanCommits++;
            user.humanLines += c.LinesAdded || 0;
          }

          appTotalCommits++;
          if (c.IsAI) {
            appAICommits++;
          }
          appTotalLines += c.LinesAdded || 0;
          if (c.IsAI) {
            appAILines += c.LinesAdded || 0;
          }

          // Count tiers
          const tierNum = c.TierNumber || 0;
          if (tierNum === 1) appTiers.tier1++;
          else if (tierNum === 2) appTiers.tier2++;
          else if (tierNum === 3) appTiers.tier3++;
          else if (tierNum === 4) appTiers.tier4++;
          else if (tierNum === 5) appTiers.tier5++;
        }
      }

      // Use TierDistribution if available
      if (appData.TierDistribution) {
        const td = appData.TierDistribution;
        appTiers.tier1 = td.Tier1_Definitive || 0;
        appTiers.tier2 = td.Tier2_VeryHigh || 0;
        appTiers.tier3 = td.Tier3_High || 0;
        appTiers.tier4 = td.Tier4_Moderate || 0;
        appTiers.tier5 = td.Tier5_Low || 0;
      }

      // Process user statistics ONLY if no commits were available
      // (user data is already built from commits above)
      const hasCommits = appData.Commits && Array.isArray(appData.Commits) && appData.Commits.length > 0;
      if (!hasCommits && appData.UserStatistics && Array.isArray(appData.UserStatistics)) {
        for (const ua of appData.UserStatistics) {
          const authorName = ua.UserName || 'Unknown';
          contributorSet.add(authorName);
          appContributors.add(authorName);

          if (!users[authorName]) {
            users[authorName] = {
              name: authorName,
              totalCommits: 0,
              aiCommits: 0,
              humanCommits: 0,
              totalLines: 0,
              aiLines: 0,
              humanLines: 0,
              aiPercentage: 0,
              applications: {},
            };
          }

          const user = users[authorName];
          user.totalCommits += ua.TotalCommits || 0;
          user.aiCommits += ua.AICommits || 0;
          user.humanCommits += ua.HumanCommits || 0;
          user.totalLines += ua.TotalLinesAdded || 0;
          user.aiLines += ua.AILinesAdded || 0;
          user.humanLines += ua.HumanLinesAdded || 0;

          // Track per-application stats
          if (!user.applications[appName]) {
            user.applications[appName] = {
              totalCommits: 0,
              aiCommits: 0,
              totalLines: 0,
              aiLines: 0,
            };
          }
          const appStats = user.applications[appName] as UserApplicationStats;
          appStats.totalCommits += ua.TotalCommits || 0;
          appStats.aiCommits += ua.AICommits || 0;
          appStats.totalLines += ua.TotalLinesAdded || 0;
          appStats.aiLines += ua.AILinesAdded || 0;
        }
      }

      // Calculate app AI percentage
      const appAIPercentage = calculateAIPercentage(appAICommits, appTotalCommits);

      // Create branch data
      branches.push({
        application: appName,
        branch: branch,
        totalCommits: appTotalCommits,
        aiCommits: appAICommits,
        humanCommits: appTotalCommits - appAICommits,
        totalLines: appTotalLines,
        aiLines: appAILines,
        humanLines: appTotalLines - appAILines,
        aiPercentage: appAIPercentage,
        tier: getTierFromPercentage(appAIPercentage),
        tiers: appTiers,
      });

      // Create application data
      applications.push({
        name: appName,
        branch: branch,
        totalCommits: appTotalCommits,
        aiCommits: appAICommits,
        humanCommits: appTotalCommits - appAICommits,
        totalLines: appTotalLines,
        aiLines: appAILines,
        humanLines: appTotalLines - appAILines,
        aiPercentage: appAIPercentage,
        contributors: appContributors.size,
        tier: getTierFromPercentage(appAIPercentage),
        tiers: appTiers,
      });

      // Accumulate totals
      totalCommits += appTotalCommits;
      aiCommits += appAICommits;
      totalLines += appTotalLines;
      aiLines += appAILines;
      tiers.tier1 += appTiers.tier1;
      tiers.tier2 += appTiers.tier2;
      tiers.tier3 += appTiers.tier3;
      tiers.tier4 += appTiers.tier4;
      tiers.tier5 += appTiers.tier5;
    }
  }

  // Process applications array if present (old format)
  if (rawData.applications && Array.isArray(rawData.applications)) {
    for (const app of rawData.applications) {
      const appName = app.applicationName || 'Unknown';
      const branch = app.branch || 'unknown';
      applicationSet.add(appName);

      // Process branch analysis
      if (app.branchAnalysis) {
        for (const ba of app.branchAnalysis) {
          const aiPct = ba.AIPercentage || 0;
          const branchData: BranchData = {
            application: appName,
            branch: ba.Branch || branch,
            totalCommits: ba.TotalCommits || 0,
            aiCommits: ba.AICommits || 0,
            humanCommits: ba.HumanCommits || 0,
            totalLines: ba.TotalLines || 0,
            aiLines: ba.AILines || 0,
            humanLines: ba.HumanLines || 0,
            aiPercentage: aiPct,
            tier: getTierFromPercentage(aiPct),
            tiers: {
              tier1: ba.Tier1 || 0,
              tier2: ba.Tier2 || 0,
              tier3: ba.Tier3 || 0,
              tier4: ba.Tier4 || 0,
              tier5: ba.Tier5 || 0,
            },
          };
          branches.push(branchData);

          // Accumulate totals
          totalCommits += branchData.totalCommits;
          aiCommits += branchData.aiCommits;
          totalLines += branchData.totalLines;
          aiLines += branchData.aiLines;
          tiers.tier1 += branchData.tiers.tier1;
          tiers.tier2 += branchData.tiers.tier2;
          tiers.tier3 += branchData.tiers.tier3;
          tiers.tier4 += branchData.tiers.tier4;
          tiers.tier5 += branchData.tiers.tier5;
        }
      }

      // Process user analysis
      if (app.userAnalysis) {
        for (const ua of app.userAnalysis) {
          const authorName = ua.Author || 'Unknown';
          contributorSet.add(authorName);

          if (!users[authorName]) {
            users[authorName] = {
              name: authorName,
              totalCommits: 0,
              aiCommits: 0,
              humanCommits: 0,
              totalLines: 0,
              aiLines: 0,
              humanLines: 0,
              aiPercentage: 0,
              applications: {},
            };
          }

          const user = users[authorName];
          user.totalCommits += ua.TotalCommits || 0;
          user.aiCommits += ua.AICommits || 0;
          user.humanCommits += ua.HumanCommits || 0;
          user.totalLines += ua.TotalLines || 0;
          user.aiLines += ua.AILines || 0;
          user.humanLines += ua.HumanLines || 0;

          // Track per-application stats
          if (!user.applications[appName]) {
            user.applications[appName] = {
              totalCommits: 0,
              aiCommits: 0,
              totalLines: 0,
              aiLines: 0,
            };
          }
          const appStats = user.applications[appName] as UserApplicationStats;
          appStats.totalCommits += ua.TotalCommits || 0;
          appStats.aiCommits += ua.AICommits || 0;
          appStats.totalLines += ua.TotalLines || 0;
          appStats.aiLines += ua.AILines || 0;
        }
      }

      // Process commits
      if (app.commits) {
        for (const c of app.commits) {
          const commitData: CommitData = {
            hash: c.Hash || '',
            author: c.Author || 'Unknown',
            date: c.Date || '',
            message: c.Message || '',
            linesAdded: c.LinesAdded || 0,
            isAI: c.IsAI || false,
            confidenceScore: c.ConfidenceScore || 0,
            tierNumber: c.TierNumber || 5,
            application: appName,
          };
          commits.push(commitData);
          contributorSet.add(commitData.author);
        }
      }

      // Build application summary
      const appTotalCommits = app.branchAnalysis?.reduce((sum, ba) => sum + (ba.TotalCommits || 0), 0) || 0;
      const appAICommits = app.branchAnalysis?.reduce((sum, ba) => sum + (ba.AICommits || 0), 0) || 0;
      const appTotalLines = app.branchAnalysis?.reduce((sum, ba) => sum + (ba.TotalLines || 0), 0) || 0;
      const appAILines = app.branchAnalysis?.reduce((sum, ba) => sum + (ba.AILines || 0), 0) || 0;
      const appContributors = new Set(app.userAnalysis?.map((ua) => ua.Author) || []).size;
      const appAIPercentage = calculateAIPercentage(appAICommits, appTotalCommits);

      applications.push({
        name: appName,
        branch: branch,
        totalCommits: appTotalCommits,
        aiCommits: appAICommits,
        humanCommits: appTotalCommits - appAICommits,
        totalLines: appTotalLines,
        aiLines: appAILines,
        humanLines: appTotalLines - appAILines,
        aiPercentage: appAIPercentage,
        contributors: appContributors,
        tier: getTierFromPercentage(appAIPercentage),
        tiers: {
          tier1: app.branchAnalysis?.reduce((sum, ba) => sum + (ba.Tier1 || 0), 0) || 0,
          tier2: app.branchAnalysis?.reduce((sum, ba) => sum + (ba.Tier2 || 0), 0) || 0,
          tier3: app.branchAnalysis?.reduce((sum, ba) => sum + (ba.Tier3 || 0), 0) || 0,
          tier4: app.branchAnalysis?.reduce((sum, ba) => sum + (ba.Tier4 || 0), 0) || 0,
          tier5: app.branchAnalysis?.reduce((sum, ba) => sum + (ba.Tier5 || 0), 0) || 0,
        },
      });
    }
  }

  // Process global branch analysis if present
  if (rawData.branchAnalysis && Array.isArray(rawData.branchAnalysis)) {
    for (const ba of rawData.branchAnalysis) {
      const appName = ba.Application || 'Unknown';
      applicationSet.add(appName);

      // Check if we already have this branch from applications
      const existingBranch = branches.find(
        (b) => b.application === appName && b.branch === ba.Branch
      );

      if (!existingBranch) {
        const aiPct = ba.AIPercentage || 0;
        branches.push({
          application: appName,
          branch: ba.Branch || 'unknown',
          totalCommits: ba.TotalCommits || 0,
          aiCommits: ba.AICommits || 0,
          humanCommits: ba.HumanCommits || 0,
          totalLines: ba.TotalLines || 0,
          aiLines: ba.AILines || 0,
          humanLines: ba.HumanLines || 0,
          aiPercentage: aiPct,
          tier: getTierFromPercentage(aiPct),
          tiers: {
            tier1: ba.Tier1 || 0,
            tier2: ba.Tier2 || 0,
            tier3: ba.Tier3 || 0,
            tier4: ba.Tier4 || 0,
            tier5: ba.Tier5 || 0,
          },
        });

        totalCommits += ba.TotalCommits || 0;
        aiCommits += ba.AICommits || 0;
        totalLines += ba.TotalLines || 0;
        aiLines += ba.AILines || 0;
        tiers.tier1 += ba.Tier1 || 0;
        tiers.tier2 += ba.Tier2 || 0;
        tiers.tier3 += ba.Tier3 || 0;
        tiers.tier4 += ba.Tier4 || 0;
        tiers.tier5 += ba.Tier5 || 0;
      }
    }
  }

  // Process global user analysis if present
  if (rawData.userAnalysis && Array.isArray(rawData.userAnalysis)) {
    for (const ua of rawData.userAnalysis) {
      const authorName = ua.Author || 'Unknown';
      contributorSet.add(authorName);

      if (!users[authorName]) {
        users[authorName] = {
          name: authorName,
          totalCommits: ua.TotalCommits || 0,
          aiCommits: ua.AICommits || 0,
          humanCommits: ua.HumanCommits || 0,
          totalLines: ua.TotalLines || 0,
          aiLines: ua.AILines || 0,
          humanLines: ua.HumanLines || 0,
          aiPercentage: ua.AIPercentage || 0,
          applications: {},
        };
      }
    }
  }

  // Process file type analysis
  if (rawData.fileTypeAnalysis && Array.isArray(rawData.fileTypeAnalysis)) {
    for (const ft of rawData.fileTypeAnalysis) {
      fileTypes.push({
        extension: ft.Extension || 'unknown',
        fileCount: ft.FileCount || 0,
        totalLines: ft.TotalLines || 0,
        aiLines: ft.AILines || 0,
        humanLines: calculateHumanValue(ft.TotalLines || 0, ft.AILines || 0),
        aiPercentage: ft.AIPercentage || 0,
      });
    }
  }

  // Calculate AI percentage for users
  for (const user of Object.values(users)) {
    user.aiPercentage = calculateAIPercentage(user.aiCommits, user.totalCommits);
  }

  // Build summary
  const summary: SummaryData = {
    totalCommits,
    aiCommits,
    humanCommits: totalCommits - aiCommits,
    totalLines,
    aiLines,
    humanLines: totalLines - aiLines,
    aiPercentage: calculateAIPercentage(aiCommits, totalCommits),
    linesAiPercentage: calculateAIPercentage(aiLines, totalLines),
    contributorCount: contributorSet.size,
    applicationCount: applicationSet.size,
    tiers,
  };

  return {
    applications,
    branches,
    users,
    commits,
    fileTypes,
    metadata: rawData._metadata || null,
    summary,
  };
};

/**
 * Get unique applications from processed data
 */
export const getUniqueApplications = (processedData: ProcessedData): string[] => {
  return Array.from(new Set(processedData.applications.map((app) => app.name)));
};

/**
 * Get unique branches from processed data
 */
export const getUniqueBranches = (processedData: ProcessedData): string[] => {
  return Array.from(new Set(processedData.branches.map((branch) => branch.branch)));
};

/**
 * Get unique contributors from processed data
 */
export const getUniqueContributors = (processedData: ProcessedData): string[] => {
  return Object.keys(processedData.users).sort();
};

/**
 * Get top contributors by commit count
 */
export const getTopContributors = (
  processedData: ProcessedData,
  count: number = 10
): UserData[] => {
  return Object.values(processedData.users)
    .sort((a, b) => b.totalCommits - a.totalCommits)
    .slice(0, count);
};

/**
 * Get top file types by lines
 */
export const getTopFileTypes = (
  processedData: ProcessedData,
  count: number = 10
): FileTypeData[] => {
  return [...processedData.fileTypes]
    .sort((a, b) => b.totalLines - a.totalLines)
    .slice(0, count);
};
