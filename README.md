# peeare

Troubled by the fact Github UI doesn't allow querying pull-requests by multiple authors, even in the same repo? Worry not! With the `peeare` shell command you can track your entire team's pull requests across multiple repos! 

![peeare screenshot](https://user-images.githubusercontent.com/1366521/35621094-dda2f77a-068b-11e8-84b1-e94377d22f36.png)

## Installation

Run this in your shell:

```
npm install -g peeare
```

If you use `nodenv`, run `nodenv rehash` right after installing.

## Usage

### First time

First, you'll need to generate a Github access token.
- Go to this link: https://github.com/settings/tokens (or your enterprise version of the URL if you're using Github Enterprise).
- Run in your shell the `peeare` command. You'll be asked to enter a Github access token. Enter the one you've generated in the step above.

### Commands

- `peeare` - Shows your team's pull requests according to your configuration.
- `peeare help` - Shows an help message for peeare.
- `peeare reset` - Resets your local config.
- `peeare get at` - Shows the Github access token in your local peeare configuration.
- `peeare set at <at>` - Sets <at> as the Github access token in your local config.
- `peeare get hostname` - Shows the Github hostname in your local config. Defaults to github.com.
- `peeare set hostname <hostname>` - Sets <hostname> as the Github hostname in your local config. This value defaults to the `github.com`. Use this command if you're using Enterprise Github and require a different hostname.
- `peeare list users` - Lists all the Github users in your local config.
- `peeare add users <users, command separated>` - Adds <users> (command separated) to the Github users you want to track in your local config.
- `peeare remove users <users, command separated>` - Removes <users> (command separated) from the Github users you want to track in your local config.
- `peeare list repos` - Lists all the Github repos in your local config.
- `peeare add repos <repos, command separated>` - Adds <repos> (command separated) to the Github repos you want to track in your local config.
- `peeare remove repos <repos, command separated>` - Removes <repos> (command separated) from the Github repos you want to track in your local config.

## Tips

- In OSX, you can CMD+double-click to open the printed URLs directly.
