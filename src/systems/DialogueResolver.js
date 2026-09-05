/**
 * DialogueResolver.js
 * ----------------------------------------------------------------------------
 * Turns a dialogue definition from a map file into the actual pages of text to
 * show right now.
 *
 * WHY THIS EXISTS
 * An NPC should say different things as the story progresses. Rather than
 * scattering `if (hasFlag(...))` checks through scene code, dialogue is DATA and
 * this module picks the right branch. Scenes just ask "what does this NPC say?".
 *
 * This file contains no Phaser code, so it is fully unit tested.
 *
 * SUPPORTED SHAPES
 *
 *   'One line.'                          a single page
 *   ['Page one.', 'Page two.']           several pages
 *   { speaker: 'Mum', pages: [...] }     a page group with a name plate
 *   [                                    branches: the FIRST match wins
 *     { when: 'gotStarter',   pages: [...] },
 *     { unless: 'metWick',    pages: [...] },
 *     { pages: [...] },                  no condition = fallback, always matches
 *   ]
 *
 * BRANCH OPTIONS
 *   when     flag name (or array of names) that must ALL be set
 *   unless   flag name (or array of names) that must ALL be unset
 *   speaker  name shown above the text
 *   setFlags flag names to set once this dialogue finishes
 *   action   an event to run once this dialogue finishes, e.g. 'starterSelect'
 *   pages    the lines of text
 *
 * `action` is how data triggers gameplay. The map file says WHAT should happen
 * and WorldScene knows HOW, which keeps story content out of scene code.
 */

/** Normalise `undefined | 'a' | ['a','b']` into an array. */
function toArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Does this branch's condition pass, given the current story flags?
 * A branch with no condition always passes, which makes it the fallback.
 */
export function branchMatches(branch, flags = {}) {
  const required = toArray(branch.when);
  const forbidden = toArray(branch.unless);

  if (required.some((flag) => !flags[flag])) return false;
  if (forbidden.some((flag) => flags[flag])) return false;
  return true;
}

/**
 * Resolve a dialogue definition into something the dialogue box can display.
 *
 * @param {string|string[]|object|object[]} dialogue
 * @param {Record<string, boolean>} flags  the player's story flags
 * @returns {{ pages: string[], speaker: string|null, setFlags: string[], action: string|null }}
 *          `pages` is empty if nothing matched — callers should treat that as
 *          "this thing has nothing to say" rather than showing an empty box.
 */
export function resolveDialogue(dialogue, flags = {}) {
  const empty = { pages: [], speaker: null, setFlags: [], action: null };

  if (dialogue === undefined || dialogue === null) return empty;

  // A bare string is the most common case: one page, no speaker.
  if (typeof dialogue === 'string') {
    return { pages: [dialogue], speaker: null, setFlags: [], action: null };
  }

  if (Array.isArray(dialogue)) {
    if (dialogue.length === 0) return empty;

    // An array of strings is a multi-page block with no conditions.
    if (dialogue.every((entry) => typeof entry === 'string')) {
      return { pages: [...dialogue], speaker: null, setFlags: [], action: null };
    }

    // Otherwise it is a list of branches; the first match wins.
    const branch = dialogue.find(
      (entry) => entry && typeof entry === 'object' && branchMatches(entry, flags)
    );
    return branch ? resolveBranch(branch) : empty;
  }

  if (typeof dialogue === 'object') {
    // A single object is a branch too, so `{ when: ... }` works on its own.
    return branchMatches(dialogue, flags) ? resolveBranch(dialogue) : empty;
  }

  console.warn('[DialogueResolver] Unsupported dialogue value:', dialogue);
  return empty;
}

/** Turn one matched branch into the resolver's output shape. */
function resolveBranch(branch) {
  const pages = typeof branch.pages === 'string' ? [branch.pages] : branch.pages;

  if (!Array.isArray(pages) || pages.length === 0) {
    console.warn(
      '[DialogueResolver] A dialogue branch matched but has no "pages". ' +
        'Add a pages array so the player is not shown an empty box.',
      branch
    );
    return { pages: [], speaker: branch.speaker || null, setFlags: [], action: null };
  }

  return {
    pages: [...pages],
    speaker: branch.speaker || null,
    setFlags: toArray(branch.setFlags),
    action: branch.action || null,
  };
}

/**
 * Collect every line of text a dialogue definition could ever show.
 * Used by the test suite to check all dialogue for empty or missing pages,
 * whichever branch the player eventually takes.
 */
export function collectAllPages(dialogue) {
  if (typeof dialogue === 'string') return [dialogue];
  if (!dialogue) return [];

  if (Array.isArray(dialogue)) {
    return dialogue.flatMap((entry) => collectAllPages(entry));
  }
  if (typeof dialogue === 'object' && dialogue.pages) {
    return typeof dialogue.pages === 'string' ? [dialogue.pages] : [...dialogue.pages];
  }
  return [];
}
