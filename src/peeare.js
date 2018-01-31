require("colors");
const Octokat = require("octokat");
const ora = require("ora");
const flatten = require("lodash.flatten");
const sortBy = require("lodash.sortby");
const maxBy = require("lodash.maxby");
const print = console.log;

const MAX_PRS_TO_FETCH = 100;

// counts emoji as a single char
function realLength(str) {
  const joiner = "\u{200D}";
  const split = str.split(joiner);
  let count = 0;

  for (const s of split) {
    const num = Array.from(s.split(/[\ufe00-\ufe0f]/).join("")).length;
    count += num;
  }

  return count / split.length;
}

function fetchAndDisplayPullRequests(githubHostname, githubAccessToken, repos = [], users = []) {
  const spinner = ora();
  spinner.start(`Fetching PRs...`);
  const githubRootURL = `https://${githubHostname}/api/v3`;
  const githubClient = new Octokat({
    token: githubAccessToken,
    rootURL: githubRootURL
  });
  fetchPullRequests(githubClient, githubRootURL, repos)
    .then(prs => {
      spinner.stop();
      return prs;
    })
    .then(prs => flatten(prs).map(pr => extractPullRequestInfo(pr)))
    .then(prsInfo => prsInfo.filter(prInfo => users.includes(prInfo.author)))
    .then(relevantPRs => {
      const maxPRTitle = realLength(maxBy(relevantPRs, pr => realLength(pr.title)).title);
      const maxPRAuthor = realLength(maxBy(relevantPRs, pr => realLength(pr.author)).author);
      return sortBy(relevantPRs, "author").map(pr => formatPullRequest(pr, maxPRTitle, maxPRAuthor));
    })
    .then(formattedPRs => formattedPRs.forEach(pr => print(pr)))
    .catch(err => {
      spinner.stop();
      print(err.red || "Something unknown went wrong :(".red);
    });
}

function fetchPullRequests(githubClient, githubRootURL, repos) {
  return Promise.all(
    repos.map(repo => {
      return fetchPullRequest(githubClient, githubRootURL, repo);
    })
  );
}

function fetchPullRequest(githubClient, githubRootURL, repo) {
  return githubClient
    .fromUrl(`${githubRootURL}/repos/${repo}/pulls`)
    .fetch({ state: "open", per_page: MAX_PRS_TO_FETCH })
    .then(result => result.items);
}

function formatPullRequest(pr, maxPRTitle, maxPRAuthor) {
  return `- ${formatText(pr.title, maxPRTitle, "·").green} by ${formatText(pr.author, maxPRAuthor, " ").yellow} - ${pr.url.cyan}`;
}

function formatText(text, maxLength, char = " ", align = "left") {
  const truncatedString = text.substring(0, maxLength);
  if (realLength(truncatedString) < maxLength) {
    if (align == "left") {
      return truncatedString + char.repeat(maxLength - realLength(truncatedString));
    } else {
      return char.repeat(maxLength - realLength(truncatedString)) + truncatedString;
    }
  } else {
    return truncatedString;
  }
}

function extractPullRequestInfo(pr) {
  return {
    author: pr.user.login,
    url: pr.htmlUrl,
    title: pr.title
  };
}

module.exports = {
  run(data) {
    fetchAndDisplayPullRequests(data.hostname, data.at, data.repos, data.users);
  }
};
