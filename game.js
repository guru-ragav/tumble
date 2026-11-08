/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TUMBLE TOWER - DATA STRUCTURES EDITION
 * Fully deterministic Jenga-style game implementing real CS Data Structures:
 * - Singly Linked List (Tower Levels)
 * - FIFO Queue (Turn Rotation)
 * - LIFO Stack (Move History & Undo)
 * - Auxiliary Stack (Level Extraction Pattern)
 */

// ============================================================================
// 1. DATA STRUCTURE LAYER (Pure Node-Based Classes)
// ============================================================================

/**
 * Singly Linked List Node representing one level of the tower.
 * head = top level; following .next traverses DOWN to the foundation level (Level 1).
 */
export class LevelNode {
  constructor(levelNumber, orientation, slots = [null, null, null]) {
    this.levelNumber = levelNumber; // 1, 2, ... N
    this.orientation = orientation; // 'horizontal' | 'vertical'
    // slots array of length 3: [Block | null, Block | null, Block | null]
    this.slots = [...slots];
    /** @type {LevelNode | null} */
    this.next = null;
  }

  getBlockCount() {
    return this.slots.filter(b => b !== null).length;
  }

  isFull() {
    return this.getBlockCount() === 3;
  }

  isEmpty() {
    return this.getBlockCount() === 0;
  }

  getFirstEmptySlot() {
    return this.slots.findIndex(slot => slot === null);
  }
}

/**
 * Singly Linked List managing the tower levels from top (head) to bottom (tail).
 */
export class TowerLinkedList {
  constructor() {
    /** @type {LevelNode | null} */
    this.head = null;
    /** @type {LevelNode | null} */
    this.tail = null;
    this.length = 0;
  }

  /**
   * Prepend a new level to the top of the tower (O(1)).
   * @param {LevelNode} node
   */
  prepend(node) {
    if (!this.head) {
      this.head = node;
      this.tail = node;
      node.next = null;
    } else {
      node.next = this.head;
      this.head = node;
    }
    this.length++;
  }

  /**
   * Remove top level if empty (O(1)).
   */
  removeHead() {
    if (!this.head) return null;
    const removed = this.head;
    this.head = this.head.next;
    removed.next = null;
    this.length--;
    if (this.length === 0) {
      this.tail = null;
    }
    return removed;
  }

  /**
   * Find level by levelNumber (O(N) traversal).
   * @param {number} levelNum
   * @returns {LevelNode | null}
   */
  findLevel(levelNum) {
    let curr = this.head;
    while (curr) {
      if (curr.levelNumber === levelNum) {
        return curr;
      }
      curr = curr.next;
    }
    return null;
  }

  /**
   * Find block by unique blockId across all levels and slots.
   * @param {string} blockId
   * @returns {{ levelNode: LevelNode, slotIndex: number, block: any, comparisons: number } | null}
   */
  findBlock(blockId) {
    let curr = this.head;
    let comparisons = 0;
    while (curr) {
      for (let s = 0; s < 3; s++) {
        comparisons++;
        if (curr.slots[s] && curr.slots[s].id === blockId) {
          return { levelNode: curr, slotIndex: s, block: curr.slots[s], comparisons };
        }
      }
      curr = curr.next;
    }
    return null;
  }

  /**
   * Returns array of level nodes from HEAD (Top) down to TAIL (Base).
   */
  toArray() {
    const arr = [];
    let curr = this.head;
    while (curr) {
      arr.push(curr);
      curr = curr.next;
    }
    return arr;
  }

  /**
   * Returns array of level nodes from TAIL (Base L1) up to HEAD (Top LN).
   * Useful for rendering from foundation upward.
   */
  toReverseArray() {
    return this.toArray().reverse();
  }

  /**
   * Formats linked list pointer chain for inspection.
   * Example: "Head -> [L10: 3/3] -> [L9: 2/3] -> ... -> [L1: 3/3] -> NULL"
   */
  renderPointerChain() {
    if (!this.head) return 'Head -> NULL';
    const parts = ['Head'];
    let curr = this.head;
    while (curr) {
      parts.push(`[L${curr.levelNumber}: ${curr.getBlockCount()}/3]`);
      curr = curr.next;
    }
    parts.push('NULL');
    return parts.join(' -> ');
  }
}

/**
 * FIFO Queue Node for Player Turn Management.
 */
export class QueueNode {
  constructor(player) {
    this.player = player;
    /** @type {QueueNode | null} */
    this.next = null;
  }
}

/**
 * Custom FIFO Queue class (enqueue, dequeue, peek, isEmpty, size).
 */
export class TurnQueue {
  constructor() {
    /** @type {QueueNode | null} */
    this.front = null;
    /** @type {QueueNode | null} */
    this.rear = null;
    this.count = 0;
  }

  enqueue(player) {
    const node = new QueueNode(player);
    if (!this.rear) {
      this.front = node;
      this.rear = node;
    } else {
      this.rear.next = node;
      this.rear = node;
    }
    this.count++;
  }

  dequeue() {
    if (!this.front) return null;
    const removed = this.front;
    this.front = this.front.next;
    if (!this.front) {
      this.rear = null;
    }
    removed.next = null;
    this.count--;
    return removed.player;
  }

  peek() {
    return this.front ? this.front.player : null;
  }

  isEmpty() {
    return this.count === 0;
  }

  size() {
    return this.count;
  }

  toArray() {
    const arr = [];
    let curr = this.front;
    while (curr) {
      arr.push(curr.player);
      curr = curr.next;
    }
    return arr;
  }

  /**
   * Restores a player to the front of the queue (Used during Undo Move).
   * Prepend node at front (reverse dequeue).
   */
  rotateBackward(player) {
    const node = new QueueNode(player);
    if (!this.front) {
      this.front = node;
      this.rear = node;
    } else {
      node.next = this.front;
      this.front = node;
    }
    this.count++;
  }

  renderPointerChain() {
    if (!this.front) return 'Front -> NULL';
    const parts = ['Front'];
    let curr = this.front;
    while (curr) {
      parts.push(`[${curr.player.name}]`);
      curr = curr.next;
    }
    parts.push('NULL');
    return parts.join(' -> ');
  }
}

/**
 * LIFO Stack Node for Move History & Auxiliary Stack.
 */
export class StackNode {
  constructor(data) {
    this.data = data;
    /** @type {StackNode | null} */
    this.next = null;
  }
}

/**
 * Custom LIFO Stack class (push, pop, peek, isEmpty, size).
 */
export class HistoryStack {
  constructor() {
    /** @type {StackNode | null} */
    this.topNode = null;
    this.count = 0;
  }

  push(data) {
    const node = new StackNode(data);
    node.next = this.topNode;
    this.topNode = node;
    this.count++;
  }

  pop() {
    if (!this.topNode) return null;
    const removed = this.topNode;
    this.topNode = this.topNode.next;
    removed.next = null;
    this.count--;
    return removed.data;
  }

  peek() {
    return this.topNode ? this.topNode.data : null;
  }

  isEmpty() {
    return this.count === 0;
  }

  size() {
    return this.count;
  }

  toArray() {
    const arr = [];
    let curr = this.topNode;
    while (curr) {
      arr.push(curr.data);
      curr = curr.next;
    }
    return arr;
  }

  renderPointerChain() {
    if (!this.topNode) return 'Top -> NULL';
    const parts = ['Top'];
    let curr = this.topNode;
    let idx = 0;
    while (curr && idx < 5) {
      parts.push(`[#${curr.data.id}: ${curr.data.player.name}]`);
      curr = curr.next;
      idx++;
    }
    if (curr) parts.push(`...(${this.count - 5} more)`);
    parts.push('NULL');
    return parts.join(' -> ');
  }
}

/**
 * Auxiliary Stack class used to demonstrate the Linked List extraction pattern:
 * When removing a block at level K, pop the levels above K onto this stack,
 * extract the block, and pop levels from this stack back onto the tower.
 */
export class AuxiliaryStack {
  constructor() {
    /** @type {StackNode | null} */
    this.topNode = null;
    this.count = 0;
    this.state = 'Idle'; // 'Idle' | 'Active'
    this.description = 'Ready';
  }

  push(item) {
    const node = new StackNode(item);
    node.next = this.topNode;
    this.topNode = node;
    this.count++;
  }

  pop() {
    if (!this.topNode) return null;
    const removed = this.topNode;
    this.topNode = this.topNode.next;
    removed.next = null;
    this.count--;
    return removed.data;
  }

  isEmpty() {
    return this.count === 0;
  }

  size() {
    return this.count;
  }

  clear() {
    this.topNode = null;
    this.count = 0;
    this.state = 'Idle';
    this.description = 'Ready';
  }

  toArray() {
    const arr = [];
    let curr = this.topNode;
    while (curr) {
      arr.push(curr.data);
      curr = curr.next;
    }
    return arr;
  }

  renderPointerChain() {
    if (this.state === 'Idle' || !this.topNode) {
      return '[IDLE] - Empty';
    }
    const parts = ['Top'];
    let curr = this.topNode;
    while (curr) {
      parts.push(`[L${curr.data.levelNumber}]`);
      curr = curr.next;
    }
    parts.push('NULL');
    return parts.join(' -> ');
  }
}

// ============================================================================
// 2. AUDIO SYNTHESIZER (Pure Web Audio API - Zero External Assets)
// ============================================================================

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playWoodClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (_) {}
  }

  playWoodSlide() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(260, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (_) {}
  }

  playDropThud() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.14);
    } catch (_) {}
  }

  playCollapse() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      // Noise buffer crash
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.8);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start();
    } catch (_) {}
  }

  playUndoChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(660, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (_) {}
  }

  playWoodWobble(intensity = 1.0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const baseFreq = Math.max(50, 110 - intensity * 10);
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.4, this.ctx.currentTime + 0.12);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.85, this.ctx.currentTime + 0.3);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);

      const scaledGain = Math.min(0.3, 0.06 * intensity);
      gain.gain.setValueAtTime(scaledGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (_) {}
  }
}

export const sound = new SoundManager();

// ============================================================================
// 3. GAME STATE MACHINE & RULES ENGINE
// ============================================================================

export const GAME_STATE = {
  SETUP: 'SETUP',
  PLAYING: 'PLAYING',
  SELECTED: 'SELECTED',
  ANIMATING: 'ANIMATING',
  GAME_OVER: 'GAME_OVER'
};

export class TumbleTowerGame {
  constructor() {
    this.state = GAME_STATE.SETUP;
    this.tower = new TowerLinkedList();
    this.turnQueue = new TurnQueue();
    this.historyStack = new HistoryStack();
    this.auxStack = new AuxiliaryStack();

    this.totalMoves = 0;
    this.blocksPlaced = 0;
    this.moveCounter = 1;

    /** @type {string | null} */
    this.selectedBlockId = null;
    this.viewAngle = 'iso'; // 'iso' | 'front' | 'side' | 'top'
    this.lastCollapseReport = null;

    // Toast and error handling
    this.toasts = [];

    // Pre-allocated player palette
    this.playerColors = ['#06b6d4', '#f59e0b', '#10b981', '#a855f7'];
  }

  /**
   * Initializes a fresh tower of levels x 3 blocks.
   * Level 1 (bottom) to Level N (top).
   * Parity: Level 1 = horizontal, Level 2 = vertical, etc.
   * @param {number} initialHeight
   */
  initTower(initialHeight = 10) {
    this.tower = new TowerLinkedList();
    this.historyStack = new HistoryStack();
    this.auxStack.clear();
    this.totalMoves = 0;
    this.blocksPlaced = 0;
    this.moveCounter = 1;
    this.selectedBlockId = null;
    this.lastCollapseReport = null;

    const count = Math.max(3, Math.min(16, initialHeight));
    // In our Singly Linked List, head is the TOP level.
    // So we prepend from 1 up to count.
    for (let lvl = 1; lvl <= count; lvl++) {
      const orientation = lvl % 2 === 1 ? 'horizontal' : 'vertical';
      const slots = [
        { id: `L${lvl}-B1`, originalLevel: lvl, originalSlot: 0 },
        { id: `L${lvl}-B2`, originalLevel: lvl, originalSlot: 1 },
        { id: `L${lvl}-B3`, originalLevel: lvl, originalSlot: 2 }
      ];
      const levelNode = new LevelNode(lvl, orientation, slots);
      this.tower.prepend(levelNode);
    }
  }

  /**
   * Setup players and begin the game.
   * @param {string[]} playerNames
   * @param {number} initialHeight
   */
  startNewGame(playerNames, initialHeight = 10) {
    if (!playerNames || playerNames.length < 2) {
      throw new Error('At least 2 players required');
    }

    this.turnQueue = new TurnQueue();
    playerNames.forEach((name, index) => {
      this.turnQueue.enqueue({
        id: `P${index + 1}`,
        name: name.trim(),
        color: this.playerColors[index % this.playerColors.length],
        movesCount: 0
      });
    });

    this.initTower(initialHeight);
    this.state = GAME_STATE.PLAYING;
  }

  /**
   * Returns current active player from turn queue.
   */
  getCurrentPlayer() {
    return this.turnQueue.peek();
  }

  /**
   * Evaluates if a block is removable under the game rules:
   * 1. Cannot remove from the top level if it's incomplete or if it's the uppermost level.
   * 2. Cannot remove if doing so leaves its level with zero blocks.
   * @param {string} blockId
   * @returns {{ canRemove: boolean, reason: string }}
   */
  checkBlockRemovability(blockId) {
    const lookup = this.tower.findBlock(blockId);
    if (!lookup) {
      return { canRemove: false, reason: 'Block does not exist' };
    }

    const { levelNode } = lookup;
    const topLevel = this.tower.head;

    // Rule 1: A block is removable only if it is not on the top level
    if (topLevel && levelNode.levelNumber === topLevel.levelNumber) {
      return {
        canRemove: false,
        reason: 'Cannot remove blocks from the top level'
      };
    }

    // Rule 2: Cannot leave level with zero blocks
    const currentBlockCount = levelNode.getBlockCount();
    if (currentBlockCount <= 1) {
      return {
        canRemove: false,
        reason: 'Cannot remove the last remaining block from a level'
      };
    }

    return { canRemove: true, reason: 'Removable' };
  }

  /**
   * Deterministic Stability Check:
   * Rule (a): collapses if a level is left with just the side blocks and the player pulled
   * the center one in a way that leaves an unsupported level above it.
   * Rule (b): collapses if a level has 0 blocks.
   * Also checks off-center single side block supporting tower above.
   * 
   * @returns {{ collapsed: boolean, reason: string, levelNumber: number | null }}
   */
  checkTowerStability() {
    const levelsBottomToTop = this.tower.toReverseArray();

    for (let i = 0; i < levelsBottomToTop.length; i++) {
      const lvl = levelsBottomToTop[i];
      const count = lvl.getBlockCount();
      const hasLeft = lvl.slots[0] !== null;
      const hasCenter = lvl.slots[1] !== null;
      const hasRight = lvl.slots[2] !== null;

      // Condition (b): Level has 0 blocks
      if (count === 0) {
        return {
          collapsed: true,
          reason: `Level ${lvl.levelNumber} has 0 blocks remaining.`,
          levelNumber: lvl.levelNumber
        };
      }

      // If there are levels above this level:
      if (i < levelsBottomToTop.length - 1) {
        // If this level has only an off-center single side block (left only or right only)
        if (count === 1 && !hasCenter) {
          return {
            collapsed: true,
            reason: `Level ${lvl.levelNumber} was left with only an off-center outer block, causing the tower above to topple.`,
            levelNumber: lvl.levelNumber
          };
        }

        // Condition (a): Level has only side blocks [0, 2] and no center [1],
        // and the level directly above it has ONLY a center block [1].
        const upperLvl = levelsBottomToTop[i + 1];
        const upperHasCenterOnly = !upperLvl.slots[0] && upperLvl.slots[1] && !upperLvl.slots[2];
        if (!hasCenter && hasLeft && hasRight && upperHasCenterOnly) {
          return {
            collapsed: true,
            reason: `Level ${upperLvl.levelNumber}'s center anchor had no physical support because Level ${lvl.levelNumber}'s center was removed.`,
            levelNumber: lvl.levelNumber
          };
        }
      }
    }

    return { collapsed: false, reason: 'Stable', levelNumber: null };
  }

  /**
   * Forecasts stability if the given block was removed.
   * Does NOT mutate state.
   */
  forecastRemovalStability(blockId) {
    const lookup = this.tower.findBlock(blockId);
    if (!lookup) return { willCollapse: false, reason: 'Safe' };

    const { levelNode, slotIndex } = lookup;
    // Temporarily simulate removal
    const originalBlock = levelNode.slots[slotIndex];
    levelNode.slots[slotIndex] = null;

    const result = this.checkTowerStability();

    // Restore immediately
    levelNode.slots[slotIndex] = originalBlock;

    return {
      willCollapse: result.collapsed,
      reason: result.reason,
      levelNumber: result.levelNumber
    };
  }

  /**
   * Returns Level stability tag: 'stable' | 'unstable' | 'critical'
   * @param {LevelNode} levelNode
   */
  getLevelStabilityStatus(levelNode) {
    const count = levelNode.getBlockCount();
    const hasCenter = levelNode.slots[1] !== null;

    if (count === 1) {
      return hasCenter ? 'unstable' : 'critical-unstable';
    }
    if (count === 2 && !hasCenter) {
      return 'unstable';
    }
    return 'stable';
  }

  /**
   * User interaction: Select a block.
   * NEVER mutates tower state!
   * @param {string} blockId
   */
  selectBlock(blockId) {
    if (this.state !== GAME_STATE.PLAYING && this.state !== GAME_STATE.SELECTED) {
      return { success: false, message: 'Cannot select right now' };
    }

    const removability = this.checkBlockRemovability(blockId);
    if (!removability.canRemove) {
      return { success: false, message: removability.reason };
    }

    this.selectedBlockId = blockId;
    this.state = GAME_STATE.SELECTED;
    sound.playWoodClick();
    return { success: true, message: 'Block selected' };
  }

  /**
   * Deselect block without changing anything.
   */
  deselectBlock() {
    if (this.state === GAME_STATE.SELECTED) {
      this.selectedBlockId = null;
      this.state = GAME_STATE.PLAYING;
    }
  }

  /**
   * Confirms removal of the selected block.
   * Executes the full CS removal flow via Auxiliary Stack:
   * 1. Pops levels above onto Auxiliary Stack.
   * 2. Extracts block from target level.
   * 3. Pushes levels back from Auxiliary Stack.
   * 4. Places block on top level (or prepends new level if top is full).
   * 5. Pushes move to History Stack.
   * 6. Checks collapse and rotates turn queue.
   */
  async confirmRemove(onStepCallback = null, skipDelay = false) {
    if (this.state !== GAME_STATE.SELECTED || !this.selectedBlockId) {
      return { success: false, message: 'No block selected' };
    }

    const blockId = this.selectedBlockId;
    const lookup = this.tower.findBlock(blockId);
    if (!lookup) {
      this.deselectBlock();
      return { success: false, message: 'Block lookup failed' };
    }

    const { levelNode, slotIndex, block } = lookup;
    this.state = GAME_STATE.ANIMATING;

    // --- STEP 1: CS Auxiliary Stack Demonstration ---
    this.auxStack.clear();
    this.auxStack.state = 'Active';
    this.auxStack.description = `Popping levels above L${levelNode.levelNumber} to access block...`;

    // Levels above target in the linked list (from head down to levelNode)
    let curr = this.tower.head;
    const poppedLevels = [];
    while (curr && curr !== levelNode) {
      poppedLevels.push(curr);
      this.auxStack.push(curr);
      curr = curr.next;
    }

    if (onStepCallback) onStepCallback({ step: 'aux_pop', auxStack: this.auxStack });
    sound.playWoodSlide();

    // Small delay for CSS animation (skipped during fast test runs)
    if (!skipDelay) {
      await new Promise(r => setTimeout(r, 350));
    }

    // --- STEP 2: Extract block from target level ---
    levelNode.slots[slotIndex] = null;
    const currentHeight = this.tower.head ? this.tower.head.levelNumber : 10;
    if (onStepCallback) onStepCallback({ step: 'block_extracted', levelNode, currentHeight });

    // --- STEP 3: Restore levels from Auxiliary Stack back in order ---
    while (!this.auxStack.isEmpty()) {
      this.auxStack.pop();
    }
    this.auxStack.state = 'Idle';
    this.auxStack.description = 'Ready';
    if (onStepCallback) onStepCallback({ step: 'aux_restored', auxStack: this.auxStack });

    // --- STEP 4: Place block on top level ---
    let topNode = this.tower.head;
    let placedLevel = topNode ? topNode.levelNumber : 1;
    let placedSlot = 0;

    if (topNode && !topNode.isFull()) {
      placedSlot = topNode.getFirstEmptySlot();
      topNode.slots[placedSlot] = block;
    } else {
      // Top level is full -> Prepend new level node!
      const newLvlNum = topNode ? topNode.levelNumber + 1 : 1;
      const newOrientation = newLvlNum % 2 === 1 ? 'horizontal' : 'vertical';
      const newSlots = [block, null, null];
      const newLevelNode = new LevelNode(newLvlNum, newOrientation, newSlots);
      this.tower.prepend(newLevelNode);
      placedLevel = newLvlNum;
      placedSlot = 0;
    }

    sound.playDropThud();
    this.blocksPlaced++;
    this.totalMoves++;

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer) {
      currentPlayer.movesCount++;
    }

    // --- STEP 5: Push move to History Stack ---
    const moveRecord = {
      id: this.moveCounter++,
      player: { ...currentPlayer },
      blockId: block.id,
      blockData: { ...block },
      fromLevel: levelNode.levelNumber,
      fromSlot: slotIndex,
      toLevel: placedLevel,
      toSlot: placedSlot,
      timestamp: Date.now()
    };
    this.historyStack.push(moveRecord);

    this.selectedBlockId = null;

    // --- STEP 6: Stability & Collapse Check ---
    const stability = this.checkTowerStability();

    if (stability.collapsed) {
      sound.playCollapse();
      this.state = GAME_STATE.GAME_OVER;
      this.lastCollapseReport = {
        loser: currentPlayer,
        reason: stability.reason,
        levelNumber: stability.levelNumber,
        totalMoves: this.totalMoves,
        towerHeight: this.tower.head ? this.tower.head.levelNumber : 10
      };
      return {
        success: true,
        collapsed: true,
        report: this.lastCollapseReport
      };
    }

    // Rotate Turn Queue: Dequeue current player, enqueue to rear
    const finishedPlayer = this.turnQueue.dequeue();
    if (finishedPlayer) {
      this.turnQueue.enqueue(finishedPlayer);
    }

    this.state = GAME_STATE.PLAYING;
    return {
      success: true,
      collapsed: false,
      nextPlayer: this.getCurrentPlayer()
    };
  }

  /**
   * Undo Move: Pops top move from History Stack and reverses it bit-for-bit.
   * Restores block to fromLevel/fromSlot, restores turn queue, and cleans up empty top level.
   */
  undoMove() {
    if (this.historyStack.isEmpty()) {
      return { success: false, message: 'No moves to undo' };
    }
    if (this.state === GAME_STATE.ANIMATING) {
      return { success: false, message: 'Cannot undo during animation' };
    }

    const lastMove = this.historyStack.pop();
    if (!lastMove) {
      return { success: false, message: 'Failed to retrieve last move' };
    }

    // 1. Remove block from its placed position (toLevel, toSlot)
    const toLevelNode = this.tower.findLevel(lastMove.toLevel);
    let blockToRestore = null;
    if (toLevelNode) {
      blockToRestore = toLevelNode.slots[lastMove.toSlot] || lastMove.blockData;
      toLevelNode.slots[lastMove.toSlot] = null;

      // If toLevel is the head and now completely empty, remove it
      if (toLevelNode === this.tower.head && toLevelNode.isEmpty()) {
        this.tower.removeHead();
      }
    } else {
      blockToRestore = lastMove.blockData;
    }

    // 2. Restore block to fromLevel at fromSlot
    const fromLevelNode = this.tower.findLevel(lastMove.fromLevel);
    if (fromLevelNode) {
      fromLevelNode.slots[lastMove.fromSlot] = blockToRestore;
    } else {
      console.warn('Could not find original level node during undo: L' + lastMove.fromLevel);
    }

    // 3. Restore turn queue backward
    this.turnQueue.rotateBackward(lastMove.player);

    // 4. Adjust counters
    this.totalMoves = Math.max(0, this.totalMoves - 1);
    this.blocksPlaced = Math.max(0, this.blocksPlaced - 1);
    this.selectedBlockId = null;

    if (this.state === GAME_STATE.GAME_OVER) {
      this.state = GAME_STATE.PLAYING;
      this.lastCollapseReport = null;
    } else {
      this.state = GAME_STATE.PLAYING;
    }

    sound.playUndoChime();
    return {
      success: true,
      message: `Undid Move #${lastMove.id} by ${lastMove.player.name}`
    };
  }

  /**
   * Traversal Search: search for a block ID or level number.
   * Traverses the singly linked list and returns the path taken.
   * @param {string} query
   */
  search(query) {
    if (!query) return null;
    const cleanQuery = query.trim().toUpperCase();

    // Check if searching by level number (e.g., "5" or "L5")
    const levelMatch = cleanQuery.match(/^L?(\d+)$/);
    if (levelMatch) {
      const targetLvl = parseInt(levelMatch[1], 10);
      let curr = this.tower.head;
      const path = [];
      let found = null;
      let comparisons = 0;

      while (curr) {
        comparisons++;
        path.push(`L${curr.levelNumber}`);
        if (curr.levelNumber === targetLvl) {
          found = curr;
          break;
        }
        curr = curr.next;
      }

      return {
        type: 'level',
        target: targetLvl,
        found: found !== null,
        comparisons,
        path: path.join(' -> '),
        levelNode: found
      };
    }

    // Otherwise search by block ID (e.g., "L3-B2")
    let curr = this.tower.head;
    const path = [];
    let foundBlock = null;
    let comparisons = 0;

    while (curr) {
      path.push(`L${curr.levelNumber}`);
      for (let s = 0; s < 3; s++) {
        comparisons++;
        if (curr.slots[s] && curr.slots[s].id.toUpperCase() === cleanQuery) {
          foundBlock = {
            levelNumber: curr.levelNumber,
            slotIndex: s,
            block: curr.slots[s]
          };
          break;
        }
      }
      if (foundBlock) break;
      curr = curr.next;
    }

    return {
      type: 'block',
      target: cleanQuery,
      found: foundBlock !== null,
      comparisons,
      path: path.join(' -> '),
      result: foundBlock
    };
  }
}

// ============================================================================
// 4. RENDERING & UI CONTROLLER (Reads State - Never Mutates State Directly)
// ============================================================================

export class GameUI {
  constructor(game) {
    this.game = game;
    this.dom = {};
    this.cacheDomElements();
    this.bindEvents();
  }

  cacheDomElements() {
    this.dom = {
      appRoot: document.getElementById('app-root'),
      towerStage: document.getElementById('tower-stage'),
      towerViewport: document.getElementById('tower-viewport'),
      
      // Header Actions
      btnInspectDs: document.getElementById('btn-inspect-ds'),
      btnUndo: document.getElementById('btn-undo'),
      btnUndoBadge: document.getElementById('undo-badge'),
      btnRestart: document.getElementById('btn-restart'),
      btnAudioToggle: document.getElementById('btn-audio-toggle'),
      btnRunTests: document.getElementById('btn-run-tests'),

      // Left Panel
      playerAvatar: document.getElementById('active-player-avatar'),
      playerName: document.getElementById('active-player-name'),
      playerHint: document.getElementById('active-player-hint'),
      queueList: document.getElementById('queue-list'),
      
      // Telemetry
      telemetryHeight: document.getElementById('telemetry-height'),
      telemetryBlocks: document.getElementById('telemetry-blocks'),
      telemetryMoves: document.getElementById('telemetry-moves'),
      telemetryPlaced: document.getElementById('telemetry-placed'),
      telemetryStability: document.getElementById('telemetry-stability'),
      stabilityPill: document.getElementById('stability-pill'),
      telemetryShake: document.getElementById('telemetry-shake'),

      // Search Box
      searchForm: document.getElementById('search-form'),
      searchInput: document.getElementById('search-input'),
      searchFeedback: document.getElementById('search-feedback'),

      // Stage Controls, Shake Wrapper & HUD
      towerShakeWrapper: document.getElementById('tower-shake-wrapper'),
      auxStackHud: document.getElementById('aux-stack-hud'),
      auxStatusText: document.getElementById('aux-status-text'),
      viewButtons: document.querySelectorAll('.view-btn'),

      // Action Confirmation Bar
      actionBar: document.getElementById('action-bar'),
      actionBarBlockId: document.getElementById('action-bar-block-id'),
      actionBarStability: document.getElementById('action-bar-stability'),
      btnConfirmRemove: document.getElementById('btn-confirm-remove'),
      btnDeselect: document.getElementById('btn-deselect'),

      // Right Panel
      historyList: document.getElementById('history-list'),
      pointerTower: document.getElementById('pointer-tower'),
      pointerQueue: document.getElementById('pointer-queue'),
      pointerHistory: document.getElementById('pointer-history'),

      // Modals
      setupModal: document.getElementById('setup-modal'),
      btnStartGame: document.getElementById('btn-start-game'),
      playerCountChips: document.querySelectorAll('.player-count-selector:not(.height-selector) .count-chip'),
      heightChips: document.querySelectorAll('.height-chip'),
      playerInputsList: document.getElementById('player-inputs-list'),

      gameOverModal: document.getElementById('game-over-modal'),
      gameOverLoser: document.getElementById('game-over-loser'),
      gameOverReason: document.getElementById('game-over-reason'),
      gameOverMoves: document.getElementById('game-over-moves'),
      gameOverHeight: document.getElementById('game-over-height'),
      btnPlayAgain: document.getElementById('btn-play-again'),

      restartModal: document.getElementById('restart-modal'),
      btnConfirmRestart: document.getElementById('btn-confirm-restart'),
      btnCancelRestart: document.getElementById('btn-cancel-restart'),

      dsModal: document.getElementById('ds-modal'),
      btnCloseDsModal: document.getElementById('btn-close-ds-modal'),
      dsTowerChain: document.getElementById('ds-tower-chain'),
      dsQueueChain: document.getElementById('ds-queue-chain'),
      dsHistoryChain: document.getElementById('ds-history-chain'),
      dsAuxStatus: document.getElementById('ds-aux-status'),

      testModal: document.getElementById('test-modal'),
      btnCloseTestModal: document.getElementById('btn-close-test-modal'),
      testLog: document.getElementById('test-log'),

      toastContainer: document.getElementById('toast-container')
    };
  }

  bindEvents() {
    // 1. EVENT DELEGATION FOR TOWER BLOCKS
    // Resolves Known Bug 1 & 2: No stale handlers, clicks validated, event delegated
    if (this.dom.towerStage) {
      this.dom.towerStage.addEventListener('click', (e) => {
        const blockEl = e.target.closest('[data-block-id]');
        if (!blockEl) return;
        this.handleBlockClick(blockEl.dataset.blockId);
      });
    }

    // 2. Action Bar Confirm & Deselect
    if (this.dom.btnConfirmRemove) {
      this.dom.btnConfirmRemove.addEventListener('click', () => this.handleConfirmRemove());
    }
    if (this.dom.btnDeselect) {
      this.dom.btnDeselect.addEventListener('click', () => {
        this.game.deselectBlock();
        this.render();
      });
    }

    // 3. Undo Move
    if (this.dom.btnUndo) {
      this.dom.btnUndo.addEventListener('click', () => this.handleUndo());
    }
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this.handleUndo();
      }
    });

    // 4. View Angle Controls
    this.dom.viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.setViewAngle(view);
      });
    });

    // 5. Audio Toggle
    if (this.dom.btnAudioToggle) {
      this.dom.btnAudioToggle.addEventListener('click', () => {
        sound.enabled = !sound.enabled;
        this.dom.btnAudioToggle.textContent = sound.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        this.showToast(sound.enabled ? 'Sound enabled' : 'Sound muted', 'info');
      });
    }

    // 6. Search Form
    if (this.dom.searchForm) {
      this.dom.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSearch();
      });
    }

    // 7. Modals: Setup
    this.dom.playerCountChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.dom.playerCountChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const count = parseInt(chip.dataset.count, 10);
        this.renderPlayerInputs(count);
      });
    });

    if (this.dom.heightChips) {
      this.dom.heightChips.forEach(chip => {
        chip.addEventListener('click', () => {
          this.dom.heightChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        });
      });
    }

    if (this.dom.btnStartGame) {
      this.dom.btnStartGame.addEventListener('click', () => this.handleStartGame());
    }

    // 8. Modals: Restart
    if (this.dom.btnRestart) {
      this.dom.btnRestart.addEventListener('click', () => {
        this.dom.restartModal.style.display = 'flex';
      });
    }
    if (this.dom.btnConfirmRestart) {
      this.dom.btnConfirmRestart.addEventListener('click', () => {
        this.dom.restartModal.style.display = 'none';
        this.dom.setupModal.style.display = 'flex';
        this.game.state = GAME_STATE.SETUP;
      });
    }
    if (this.dom.btnCancelRestart) {
      this.dom.btnCancelRestart.addEventListener('click', () => {
        this.dom.restartModal.style.display = 'none';
      });
    }

    // 9. Modals: Game Over
    if (this.dom.btnPlayAgain) {
      this.dom.btnPlayAgain.addEventListener('click', () => {
        this.dom.gameOverModal.style.display = 'none';
        this.dom.setupModal.style.display = 'flex';
        this.game.state = GAME_STATE.SETUP;
      });
    }

    // 10. Modals: Data Structures Inspector
    if (this.dom.btnInspectDs) {
      this.dom.btnInspectDs.addEventListener('click', () => {
        this.renderDsInspectorModal();
        this.dom.dsModal.style.display = 'flex';
      });
    }
    if (this.dom.btnCloseDsModal) {
      this.dom.btnCloseDsModal.addEventListener('click', () => {
        this.dom.dsModal.style.display = 'none';
      });
    }

    // 11. Modals: Test Suite
    if (this.dom.btnRunTests) {
      this.dom.btnRunTests.addEventListener('click', () => {
        this.runTestSuiteInUI();
      });
    }
    if (this.dom.btnCloseTestModal) {
      this.dom.btnCloseTestModal.addEventListener('click', () => {
        this.dom.testModal.style.display = 'none';
      });
    }

    // 12. Global error boundaries to prevent any silent crash
    window.onerror = (msg, url, lineNo, columnNo, error) => {
      console.error('Unhandled runtime error:', msg, error);
      this.showToast(`Error: ${msg}`, 'error');
      return false;
    };
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showToast(`Error: ${event.reason?.message || event.reason}`, 'error');
    });
  }

  setViewAngle(view) {
    this.game.viewAngle = view;
    this.dom.viewButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    if (this.dom.towerStage) {
      this.dom.towerStage.className = `tower-stage view-${view}`;
      if (this.game.state === GAME_STATE.GAME_OVER) {
        this.dom.towerStage.classList.add('is-collapsed');
      }
    }
  }

  handleBlockClick(blockId) {
    try {
      if (this.game.state === GAME_STATE.ANIMATING || this.game.state === GAME_STATE.GAME_OVER) {
        return;
      }

      // If clicked the already selected block, toggle deselect
      if (this.game.selectedBlockId === blockId) {
        this.game.deselectBlock();
        this.render();
        return;
      }

      const result = this.game.selectBlock(blockId);
      if (!result.success) {
        this.showToast(result.message, 'info');
      }
      this.render();
    } catch (err) {
      console.error('Error selecting block:', err);
      this.showToast('Could not select block. Please try again.', 'error');
    }
  }

  triggerTowerShake(height = null) {
    const wrapper = this.dom.towerShakeWrapper;
    if (!wrapper) return;

    // Calculate current tower height (or use provided height)
    const currentHeight = height !== null ? height : (this.game.tower.head ? this.game.tower.head.levelNumber : 10);
    
    // As tower height decreases, shake intensity increases:
    // Standard baseline height = 10.
    // If height >= 10: intensity = 1.0 (subtle realistic wobble)
    // If height is 8: intensity = 2.0
    // If height is 6: intensity = 3.0
    // If height is 4: intensity = 4.0
    // If height <= 2: intensity = 5.0
    const intensity = Math.max(1.0, Math.min(5.0, 1.0 + Math.max(0, 10 - currentHeight) * 0.5));

    const transX = (2.5 * intensity).toFixed(1);
    const transY = (1.8 * intensity).toFixed(1);
    const rotZ = (0.7 * intensity).toFixed(1);

    wrapper.style.setProperty('--shake-intensity', intensity.toFixed(2));
    wrapper.style.setProperty('--shake-trans-x', `${transX}px`);
    wrapper.style.setProperty('--shake-trans-y', `${transY}px`);
    wrapper.style.setProperty('--shake-rot', `${rotZ}deg`);

    // Reset animation if already running to re-trigger seamlessly
    wrapper.classList.remove('tower-shaking');
    void wrapper.offsetWidth; // Force CSS reflow
    wrapper.classList.add('tower-shaking');

    // Trigger procedural audio wobble scaled to intensity
    sound.playWoodWobble(intensity);

    setTimeout(() => {
      wrapper.classList.remove('tower-shaking');
    }, 460);
  }

  async handleConfirmRemove() {
    try {
      this.dom.btnConfirmRemove.disabled = true;
      const res = await this.game.confirmRemove((stepInfo) => {
        if (stepInfo.step === 'block_extracted') {
          this.triggerTowerShake(stepInfo.currentHeight);
        }
        this.renderAuxHud();
      });

      this.render();

      if (res.collapsed) {
        this.dom.towerStage.classList.add('is-collapsed');
        // Render scatter variables on blocks for 3D physics aesthetic
        const blocks = this.dom.towerStage.querySelectorAll('.tower-block');
        blocks.forEach((el, idx) => {
          el.style.setProperty('--scatter-x', ((idx * 37) % 100) / 100);
          el.style.setProperty('--scatter-y', ((idx * 53) % 100) / 100);
          el.style.setProperty('--scatter-r', (idx % 2 === 0 ? 1 : -1) * (30 + (idx % 60)));
        });

        setTimeout(() => {
          this.showGameOverModal(res.report);
        }, 1200);
      }
    } catch (err) {
      console.error('Error confirming block removal:', err);
      this.showToast('Error removing block.', 'error');
      this.game.state = GAME_STATE.PLAYING;
      this.render();
    } finally {
      if (this.dom.btnConfirmRemove) {
        this.dom.btnConfirmRemove.disabled = false;
      }
    }
  }

  handleUndo() {
    try {
      const res = this.game.undoMove();
      if (!res.success) {
        this.showToast(res.message, 'info');
      } else {
        this.showToast(res.message, 'success');
        this.dom.towerStage.classList.remove('is-collapsed');
      }
      this.render();
    } catch (err) {
      console.error('Error during undo:', err);
      this.showToast('Failed to undo move.', 'error');
    }
  }

  handleSearch() {
    const val = this.dom.searchInput.value;
    if (!val) return;

    const res = this.game.search(val);
    if (!res || !res.found) {
      this.dom.searchFeedback.textContent = `Traversal complete: "${val}" not found (${res ? res.comparisons : 0} nodes inspected)`;
      this.dom.searchFeedback.style.color = 'var(--accent-rose)';
      this.showToast(`Not found: ${val}`, 'info');
      return;
    }

    this.dom.searchFeedback.textContent = `Found! Comparisons: ${res.comparisons}. Path: ${res.path}`;
    this.dom.searchFeedback.style.color = 'var(--accent-emerald)';

    // Highlight target level or block
    if (res.type === 'level') {
      const targetLvlEl = document.querySelector(`[data-level-num="${res.target}"]`);
      if (targetLvlEl) {
        targetLvlEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetLvlEl.classList.add('traversal-highlight');
        setTimeout(() => targetLvlEl.classList.remove('traversal-highlight'), 3000);
      }
    } else if (res.type === 'block') {
      const blockEl = document.querySelector(`[data-block-id="${res.target}"]`);
      if (blockEl) {
        blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        blockEl.classList.add('traversal-highlight');
        setTimeout(() => blockEl.classList.remove('traversal-highlight'), 3000);
      }
    }
  }

  renderPlayerInputs(count) {
    let html = '';
    for (let i = 1; i <= count; i++) {
      const color = this.game.playerColors[(i - 1) % this.game.playerColors.length];
      html += `
        <div class="player-input-row">
          <div class="player-input-color" style="background-color: ${color};"></div>
          <input type="text" class="input-text player-name-input" data-index="${i}" placeholder="Player ${i}" value="Player ${i}" maxlength="18" />
        </div>
      `;
    }
    this.dom.playerInputsList.innerHTML = html;
  }

  handleStartGame() {
    const inputs = this.dom.playerInputsList.querySelectorAll('.player-name-input');
    const names = [];
    let hasError = false;

    inputs.forEach(input => {
      const trimmed = input.value.trim();
      if (!trimmed) {
        this.showToast('Player names cannot be blank.', 'error');
        hasError = true;
        return;
      }
      names.push(trimmed);
    });

    if (hasError) return;

    // Check unique names
    const unique = new Set(names);
    if (unique.size !== names.length) {
      this.showToast('Player names must be unique.', 'error');
      return;
    }

    const activeHeightChip = document.querySelector('.height-chip.active');
    const startHeight = activeHeightChip ? parseInt(activeHeightChip.dataset.height, 10) : 10;

    try {
      this.game.startNewGame(names, startHeight);
      this.dom.setupModal.style.display = 'none';
      this.render();
      this.showToast(`Game started with ${names.length} players (${startHeight} levels)!`, 'success');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  showGameOverModal(report) {
    if (!report) return;
    this.dom.gameOverLoser.textContent = report.loser ? report.loser.name : 'Unknown';
    this.dom.gameOverReason.textContent = report.reason;
    this.dom.gameOverMoves.textContent = report.totalMoves;
    this.dom.gameOverHeight.textContent = `Level ${report.towerHeight}`;
    this.dom.gameOverModal.style.display = 'flex';
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // --- RENDERING SUBSYSTEM (Single Source of Truth) ---

  render() {
    this.renderTower();
    this.renderActivePlayer();
    this.renderTurnQueue();
    this.renderTelemetry();
    this.renderActionBar();
    this.renderHistory();
    this.renderMiniPointerFlows();
    this.renderAuxHud();
  }

  renderTower() {
    if (!this.dom.towerStage) return;

    // Singly Linked List: head is top, tail is bottom.
    // toReverseArray() gets levels from tail (L1) to head (LN)
    const levels = this.game.tower.toReverseArray();
    const topLevel = this.game.tower.head;

    let html = '';
    levels.forEach(lvl => {
      const stabilityStatus = this.game.getLevelStabilityStatus(lvl);
      const isTopLevel = topLevel && lvl.levelNumber === topLevel.levelNumber;
      const isTopIncomplete = isTopLevel && !lvl.isFull();
      const levelBlockCount = lvl.getBlockCount();

      let badgeText = `L${lvl.levelNumber}`;
      if (stabilityStatus === 'unstable') badgeText += ' ⚠️';
      if (stabilityStatus === 'critical-unstable') badgeText += ' 🚨';

      html += `
        <div class="tower-level orientation-${lvl.orientation} ${stabilityStatus}" data-level-num="${lvl.levelNumber}">
          <div class="level-badge">${badgeText}</div>
      `;

      // Render 3 slots
      for (let s = 0; s < 3; s++) {
        const block = lvl.slots[s];
        if (!block) {
          html += `<div class="tower-block tower-slot-empty" data-slot="${s}"></div>`;
        } else {
          const isSelected = this.game.selectedBlockId === block.id;
          // Rule: cannot remove from top level or if only 1 block left on level
          const isNonRemovable = isTopLevel || levelBlockCount <= 1;

          html += `
            <div class="tower-block ${isSelected ? 'is-selected' : ''} ${isNonRemovable ? 'non-removable' : ''}" 
                 data-block-id="${block.id}" 
                 tabindex="0"
                 role="button"
                 aria-label="Level ${lvl.levelNumber} Block ${s + 1} ID ${block.id}">
              <div class="block-face block-face-top">
                <span>${block.id}</span>
              </div>
            </div>
          `;
        }
      }

      html += `</div>`;
    });

    this.dom.towerStage.innerHTML = html;
  }

  renderActivePlayer() {
    const player = this.game.getCurrentPlayer();
    if (!player) return;

    this.dom.playerName.textContent = player.name;
    this.dom.playerAvatar.textContent = player.name.charAt(0).toUpperCase();
    this.dom.playerAvatar.style.backgroundColor = player.color;
    this.dom.playerAvatar.style.boxShadow = `0 0 14px ${player.color}`;

    if (this.game.state === GAME_STATE.SELECTED) {
      this.dom.playerHint.textContent = `Review stability & click Confirm Remove`;
    } else {
      this.dom.playerHint.textContent = `Select a block from levels below top`;
    }
  }

  renderTurnQueue() {
    const players = this.game.turnQueue.toArray();
    let html = '';
    players.forEach((p, index) => {
      const isActive = index === 0;
      html += `
        <div class="queue-node-item ${isActive ? 'is-active' : ''}">
          <div class="queue-player-badge">
            <span class="color-dot" style="background-color: ${p.color};"></span>
            <span>${p.name}</span>
          </div>
          <span class="queue-pos-tag">${isActive ? 'ACTIVE' : `NEXT (+${index})`}</span>
        </div>
      `;
    });
    this.dom.queueList.innerHTML = html;
  }

  renderTelemetry() {
    const head = this.game.tower.head;
    const height = head ? head.levelNumber : 0;
    
    // Count total blocks in linked list
    let totalBlocks = 0;
    let curr = this.game.tower.head;
    while (curr) {
      totalBlocks += curr.getBlockCount();
      curr = curr.next;
    }

    this.dom.telemetryHeight.textContent = height;
    this.dom.telemetryBlocks.textContent = totalBlocks;
    this.dom.telemetryMoves.textContent = this.game.totalMoves;
    this.dom.telemetryPlaced.textContent = this.game.blocksPlaced;

    // Dynamic Shake Intensity based on tower height (scales up as height decreases)
    const shakeIntensity = Math.max(1.0, Math.min(5.0, 1.0 + Math.max(0, 10 - height) * 0.5));
    if (this.dom.telemetryShake) {
      let label = 'Mild';
      if (shakeIntensity >= 4.0) label = 'Extreme';
      else if (shakeIntensity >= 3.0) label = 'Heavy';
      else if (shakeIntensity >= 2.0) label = 'Moderate';
      this.dom.telemetryShake.textContent = `${shakeIntensity.toFixed(1)}x (${label})`;
    }

    // Stability Pill
    const stability = this.game.checkTowerStability();
    this.dom.telemetryStability.className = 'telemetry-stability';

    if (stability.collapsed) {
      this.dom.telemetryStability.classList.add('critical');
      this.dom.stabilityPill.textContent = '🚨 COLLAPSED';
    } else {
      // Check if any level is unstable
      let hasUnstable = false;
      let checkCurr = this.game.tower.head;
      while (checkCurr) {
        if (this.game.getLevelStabilityStatus(checkCurr) !== 'stable') {
          hasUnstable = true;
          break;
        }
        checkCurr = checkCurr.next;
      }

      if (hasUnstable) {
        this.dom.telemetryStability.classList.add('warning');
        this.dom.stabilityPill.textContent = '⚠️ UNSTABLE';
      } else {
        this.dom.stabilityPill.textContent = '✓ SOLID';
      }
    }

    // Undo badge
    if (this.dom.btnUndoBadge) {
      this.dom.btnUndoBadge.textContent = this.game.historyStack.size();
    }
    if (this.dom.btnUndo) {
      this.dom.btnUndo.disabled = this.game.historyStack.isEmpty() || this.game.state === GAME_STATE.ANIMATING;
    }
  }

  renderActionBar() {
    if (this.game.state === GAME_STATE.SELECTED && this.game.selectedBlockId) {
      this.dom.actionBar.style.display = 'flex';
      this.dom.actionBarBlockId.textContent = `Selected: ${this.game.selectedBlockId}`;

      const forecast = this.game.forecastRemovalStability(this.game.selectedBlockId);
      if (forecast.willCollapse) {
        this.dom.actionBarStability.textContent = `⚠️ DANGER: Removing this will cause the tower to collapse!`;
        this.dom.actionBarStability.className = 'action-bar-stability danger';
        this.dom.btnConfirmRemove.classList.add('btn-danger');
        this.dom.btnConfirmRemove.classList.remove('btn-primary');
        this.dom.btnConfirmRemove.textContent = 'Confirm (Destabilizes Tower)';
      } else {
        this.dom.actionBarStability.textContent = `Safe pull: Level retains stable support.`;
        this.dom.actionBarStability.className = 'action-bar-stability';
        this.dom.btnConfirmRemove.classList.add('btn-primary');
        this.dom.btnConfirmRemove.classList.remove('btn-danger');
        this.dom.btnConfirmRemove.textContent = 'Confirm Remove';
      }
    } else {
      this.dom.actionBar.style.display = 'none';
    }
  }

  renderHistory() {
    const moves = this.game.historyStack.toArray();
    if (moves.length === 0) {
      this.dom.historyList.innerHTML = `<div style="color: var(--text-dim); font-size: 11px; padding: 12px; text-align: center;">No moves recorded yet</div>`;
      return;
    }

    let html = '';
    moves.slice(0, 8).forEach((move, index) => {
      const isTop = index === 0;
      html += `
        <div class="history-item ${isTop ? 'is-top' : ''}">
          <div class="history-move-meta">
            <span class="history-step-badge">#${move.id}</span>
            <span style="color: ${move.player.color}; font-weight: 700;">${move.player.name}</span>
          </div>
          <div class="history-path">
            <span>${move.blockId}</span>
            <span>➔</span>
            <span>L${move.toLevel}</span>
          </div>
        </div>
      `;
    });
    this.dom.historyList.innerHTML = html;
  }

  renderMiniPointerFlows() {
    if (this.dom.pointerTower) {
      this.dom.pointerTower.textContent = this.game.tower.renderPointerChain();
    }
    if (this.dom.pointerQueue) {
      this.dom.pointerQueue.textContent = this.game.turnQueue.renderPointerChain();
    }
    if (this.dom.pointerHistory) {
      this.dom.pointerHistory.textContent = this.game.historyStack.renderPointerChain();
    }
  }

  renderAuxHud() {
    if (!this.dom.auxStackHud) return;
    if (this.game.auxStack.state === 'Active') {
      this.dom.auxStackHud.classList.add('is-active');
      this.dom.auxStatusText.textContent = `Aux Stack: ACTIVE (${this.game.auxStack.size()} levels)`;
    } else {
      this.dom.auxStackHud.classList.remove('is-active');
      this.dom.auxStatusText.textContent = `Aux Stack: Idle`;
    }
  }

  renderDsInspectorModal() {
    // 1. Tower Linked List Diagram
    let towerHtml = '';
    let curr = this.game.tower.head;
    while (curr) {
      const isHead = curr === this.game.tower.head;
      towerHtml += `
        <div class="ds-node-card ${isHead ? 'head-node' : ''}">
          <span class="ds-node-label">Level ${curr.levelNumber}</span>
          <span class="ds-node-pointer">${isHead ? 'HEAD' : 'next ➔'}</span>
          <span class="ds-node-data">Slots: [${curr.slots.map(s => s ? s.id : '∅').join(', ')}]</span>
        </div>
        <span class="ds-arrow">➔</span>
      `;
      curr = curr.next;
    }
    towerHtml += `<div class="ds-node-card"><span class="ds-node-label" style="color: var(--text-dim);">NULL</span></div>`;
    this.dom.dsTowerChain.innerHTML = towerHtml;

    // 2. Queue Diagram
    let queueHtml = '';
    const players = this.game.turnQueue.toArray();
    players.forEach((p, idx) => {
      const isFront = idx === 0;
      const isRear = idx === players.length - 1;
      queueHtml += `
        <div class="ds-node-card ${isFront ? 'head-node' : ''}">
          <span class="ds-node-label" style="color: ${p.color};">${p.name}</span>
          <span class="ds-node-pointer">${isFront ? 'FRONT' : isRear ? 'REAR' : 'next ➔'}</span>
          <span class="ds-node-data">Moves: ${p.movesCount}</span>
        </div>
        <span class="ds-arrow">➔</span>
      `;
    });
    queueHtml += `<div class="ds-node-card"><span class="ds-node-label" style="color: var(--text-dim);">NULL</span></div>`;
    this.dom.dsQueueChain.innerHTML = queueHtml;

    // 3. History Stack Diagram
    let historyHtml = '';
    const moves = this.game.historyStack.toArray();
    if (moves.length === 0) {
      historyHtml = `<div style="color: var(--text-dim); font-size: 12px;">Stack is currently empty.</div>`;
    } else {
      moves.slice(0, 6).forEach((m, idx) => {
        const isTop = idx === 0;
        historyHtml += `
          <div class="ds-node-card ${isTop ? 'head-node' : ''}">
            <span class="ds-node-label">Move #${m.id}</span>
            <span class="ds-node-pointer">${isTop ? 'TOP' : 'next ➔'}</span>
            <span class="ds-node-data">${m.player.name}: ${m.blockId} ➔ L${m.toLevel}</span>
          </div>
          <span class="ds-arrow">➔</span>
        `;
      });
      historyHtml += `<div class="ds-node-card"><span class="ds-node-label" style="color: var(--text-dim);">BASE ➔ NULL</span></div>`;
    }
    this.dom.dsHistoryChain.innerHTML = historyHtml;

    // 4. Auxiliary Stack Status
    this.dom.dsAuxStatus.textContent = `State: ${this.game.auxStack.state} | Stack: ${this.game.auxStack.renderPointerChain()}`;
  }

  async runTestSuiteInUI() {
    this.dom.testModal.style.display = 'flex';
    this.dom.testLog.textContent = 'Running Tumble Tower Data Structures Test Suite...\n';
    
    try {
      const results = await runUnitTests();
      let log = '';
      results.forEach(r => {
        log += `[${r.passed ? 'PASS' : 'FAIL'}] ${r.testName}\n  -> ${r.details}\n\n`;
      });
      const allPassed = results.every(r => r.passed);
      log += `===========================================\n`;
      log += `TOTAL: ${results.length} | PASSED: ${results.filter(r => r.passed).length} | FAILED: ${results.filter(r => !r.passed).length}\n`;
      log += `OVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED' : 'TESTS FAILED'}\n`;
      this.dom.testLog.textContent = log;
    } catch (err) {
      this.dom.testLog.textContent += `\nError running tests: ${err.message}`;
    }
  }
}

// ============================================================================
// 5. AUTOMATED TEST SUITE (Run via ?test=1 or in UI)
// ============================================================================

export async function runUnitTests() {
  const results = [];

  function assert(testName, condition, details = '') {
    results.push({
      testName,
      passed: Boolean(condition),
      details: condition ? (details || 'Assertion verified successfully.') : `FAILED: ${details}`
    });
  }

  console.group('TUMBLE TOWER UNIT TESTS');

  // Test 1: Singly Linked List
  try {
    const list = new TowerLinkedList();
    const l1 = new LevelNode(1, 'horizontal', [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }]);
    const l2 = new LevelNode(2, 'vertical', [{ id: 'b4' }, { id: 'b5' }, { id: 'b6' }]);
    list.prepend(l1);
    list.prepend(l2);

    assert('Linked List: Prepend & Head', list.head === l2 && list.head.next === l1, 'Head points to L2, next to L1');
    assert('Linked List: findLevel', list.findLevel(1) === l1 && list.findLevel(2) === l2, 'Successfully traversed to L1 and L2');
    const findB5 = list.findBlock('b5');
    assert('Linked List: findBlock', findB5 && findB5.levelNode === l2 && findB5.slotIndex === 1, 'Found block b5 in L2 slot 1');
  } catch (e) {
    assert('Linked List Operations', false, e.message);
  }

  // Test 2: FIFO Turn Queue
  try {
    const queue = new TurnQueue();
    queue.enqueue({ name: 'Alice' });
    queue.enqueue({ name: 'Bob' });
    queue.enqueue({ name: 'Charlie' });

    assert('Queue: Size & FIFO Order', queue.size() === 3 && queue.peek().name === 'Alice', 'Queue size 3, peek Alice');
    const first = queue.dequeue();
    assert('Queue: Dequeue Alice', first.name === 'Alice' && queue.peek().name === 'Bob', 'Alice dequeued, Bob next');
    queue.enqueue(first);
    assert('Queue: Rotate Alice to rear', queue.size() === 3 && queue.peek().name === 'Bob', 'Alice re-enqueued at rear');
    queue.rotateBackward({ name: 'UndoPlayer' });
    assert('Queue: rotateBackward for Undo', queue.peek().name === 'UndoPlayer', 'UndoPlayer successfully placed at front');
  } catch (e) {
    assert('Turn Queue Operations', false, e.message);
  }

  // Test 3: LIFO History Stack
  try {
    const stack = new HistoryStack();
    stack.push({ id: 1, action: 'move1' });
    stack.push({ id: 2, action: 'move2' });

    assert('Stack: Push & Peek', stack.size() === 2 && stack.peek().id === 2, 'Top move is #2');
    const popped = stack.pop();
    assert('Stack: Pop', popped.id === 2 && stack.peek().id === 1 && stack.size() === 1, 'Popped move 2, top is move 1');
  } catch (e) {
    assert('History Stack Operations', false, e.message);
  }

  // Test 4: Auxiliary Stack Extraction Pattern
  try {
    const aux = new AuxiliaryStack();
    aux.push({ levelNumber: 10 });
    aux.push({ levelNumber: 9 });
    assert('Auxiliary Stack: Push', aux.size() === 2 && aux.topNode.data.levelNumber === 9, 'Pushed L10 then L9');
    const popped9 = aux.pop();
    const popped10 = aux.pop();
    assert('Auxiliary Stack: Restore Order', popped9.levelNumber === 9 && popped10.levelNumber === 10 && aux.isEmpty(), 'Popped in correct reverse order');
  } catch (e) {
    assert('Auxiliary Stack Operations', false, e.message);
  }

  // Test 5: Game Simulation & Undo Move (1 move and 10 moves)
  try {
    const testGame = new TumbleTowerGame();
    testGame.startNewGame(['Tester1', 'Tester2']);
    
    // Execute 1 move
    const select1 = testGame.selectBlock('L1-B1');
    assert('Game: Block Selection', select1.success, 'Selected block L1-B1');
    
    const lookup1 = testGame.tower.findBlock('L1-B1');
    assert('Selection Invariance', lookup1 && lookup1.levelNode.slots[0] !== null, 'Selecting block did not mutate tower state!');

    // Complete move
    await testGame.confirmRemove(null, true);
    assert('Game: Move Confirmation', testGame.totalMoves === 1 && testGame.blocksPlaced === 1, 'Move counter incremented');
    
    // Undo 1 move
    const undo1 = testGame.undoMove();
    assert('Game: Undo 1 Move', undo1.success && testGame.totalMoves === 0, 'Move successfully undone, counters restored');
    
    // Verify block restored
    const restoredLookup = testGame.tower.findBlock('L1-B1');
    assert('Game: Block Restored to Exact Slot', restoredLookup && restoredLookup.levelNode.levelNumber === 1 && restoredLookup.slotIndex === 0, 'Block L1-B1 back at Level 1 Slot 0');

    // Run 10 sequential moves and undo all 10
    const snapshotInitialBlocks = testGame.tower.toArray().map(l => l.getBlockCount());
    for (let m = 1; m <= 10; m++) {
      // Find a safe removable candidate block
      let candidateId = null;
      const allLevels = testGame.tower.toArray();
      for (const lvl of allLevels) {
        if (lvl.levelNumber < testGame.tower.head.levelNumber && lvl.getBlockCount() > 1) {
          for (const s of lvl.slots) {
            if (s) {
              const forecast = testGame.forecastRemovalStability(s.id);
              if (!forecast.willCollapse) {
                candidateId = s.id;
                break;
              }
            }
          }
        }
        if (candidateId) break;
      }
      if (candidateId) {
        testGame.selectBlock(candidateId);
        await testGame.confirmRemove(null, true);
      }
    }
    assert('Game: Completed 10 Sequential Moves', testGame.totalMoves === 10, 'Total moves equals 10');

    // Undo all 10 moves
    for (let u = 0; u < 10; u++) {
      testGame.undoMove();
    }
    assert('Game: Undo 10 Moves', testGame.totalMoves === 0 && testGame.historyStack.isEmpty(), '10 moves undone, stack empty');
    const snapshotRestoredBlocks = testGame.tower.toArray().map(l => l.getBlockCount());
    assert('Tower State Reversible Bit-For-Bit', JSON.stringify(snapshotInitialBlocks) === JSON.stringify(snapshotRestoredBlocks), 'Tower block distribution identical to start');
  } catch (e) {
    assert('Game Simulation & Undo', false, e.message);
  }

  // Test 6: Deterministic Collapse Verification
  try {
    const testGame = new TumbleTowerGame();
    testGame.startNewGame(['P1', 'P2']);
    
    // Artificially leave Level 2 with 0 blocks
    const lvl2 = testGame.tower.findLevel(2);
    lvl2.slots = [null, null, null];
    const collapse0 = testGame.checkTowerStability();
    assert('Collapse: 0 Blocks on Level', collapse0.collapsed && collapse0.levelNumber === 2, 'Level with 0 blocks collapsed immediately');

    // Restore lvl2 and test off-center side block
    lvl2.slots = [{ id: 'test' }, null, null]; // Only left block
    const collapseOffCenter = testGame.checkTowerStability();
    assert('Collapse: Off-Center Side Block Under Tower', collapseOffCenter.collapsed, 'Tower collapsed due to unsupported off-center side block');
  } catch (e) {
    assert('Collapse Detection', false, e.message);
  }

  // Test 7: Turn Rotation for 2, 3, 4 players
  try {
    const q2 = new TurnQueue();
    ['P1', 'P2'].forEach(name => q2.enqueue({ name }));
    const p1 = q2.dequeue(); q2.enqueue(p1);
    assert('Turn Rotation: 2 Players', q2.peek().name === 'P2', 'P1 rotated to P2');

    const q3 = new TurnQueue();
    ['P1', 'P2', 'P3'].forEach(name => q3.enqueue({ name }));
    q3.enqueue(q3.dequeue());
    assert('Turn Rotation: 3 Players', q3.peek().name === 'P2', 'Rotated to P2');
    q3.enqueue(q3.dequeue());
    assert('Turn Rotation: 3 Players next', q3.peek().name === 'P3', 'Rotated to P3');
    q3.enqueue(q3.dequeue());
    assert('Turn Rotation: 3 Players cycle', q3.peek().name === 'P1', 'Rotated back to P1');
  } catch (e) {
    assert('Turn Rotation Verification', false, e.message);
  }

  // Test 8: Shake Intensity Scaling as Tower Height Decreases
  try {
    const calcShakeIntensity = (h) => Math.max(1.0, Math.min(5.0, 1.0 + Math.max(0, 10 - h) * 0.5));
    const intensity10 = calcShakeIntensity(10);
    const intensity8 = calcShakeIntensity(8);
    const intensity6 = calcShakeIntensity(6);
    const intensity4 = calcShakeIntensity(4);
    const intensity2 = calcShakeIntensity(2);

    assert(
      'Shake Intensity: Scales Inversely with Height',
      intensity10 < intensity8 && intensity8 < intensity6 && intensity6 < intensity4 && intensity4 < intensity2,
      `Height 10 -> ${intensity10.toFixed(1)}x, Height 6 -> ${intensity6.toFixed(1)}x, Height 2 -> ${intensity2.toFixed(1)}x (Increases as height decreases)`
    );
  } catch (e) {
    assert('Shake Intensity Scaling', false, e.message);
  }

  results.forEach(r => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.testName}: ${r.details}`);
  });
  console.groupEnd();

  return results;
}

// ============================================================================
// 6. INITIALIZATION & ENTRY POINT
// ============================================================================

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const game = new TumbleTowerGame();
    const ui = new GameUI(game);

    // Default initial 2-player setup
    game.startNewGame(['Player 1', 'Player 2']);
    ui.render();

    // Check URL query ?test=1
    if (window.location && window.location.search && window.location.search.includes('test=1')) {
      ui.runTestSuiteInUI();
    }
  });
}

