/**
 * TextWriter — simulates human-like text editing on a DOM element.
 *
 * Algorithm:
 *  1. Find the longest common subsequence (LCS) between current and target text.
 *  2. Walk from the current cursor position toward the nearest mismatch.
 *  3. Delete surplus characters, then type the missing ones.
 *  4. Repeat until the element matches the target.
 */
export class TextWriter {
	// ── Tuneable timings ────────────────────────────────────────────────────────
	writingSpeed = 180; // ms per character typed
	deletingSpeed = 120; // ms per character deleted  (backspace feels faster)
	movingSpeed = 50; // ms per cursor step
	thinkTime = 300; // ms pause between moving and typing

	// ── Internal state ──────────────────────────────────────────────────────────
	#element = null;
	#targetText = "";
	#cursorPos = 0;
	#running = false;

	constructor(element) {
		this.#element = element;
		this.#injectStyles();
		this.#element.classList.add("textWriter");
	}

	// ── Public API ───────────────────────────────────────────────────────────────

	/** Clear cursor animation and position. */
	clearCursor() {
		this.#element.removeAttribute("cursor");
		this.#cursorPos = 0;
	}

	/** Animate the element text toward the new target. Resolves when done. */
	async write(targetText) {
		this.#targetText = targetText?.toUpperCase();
		if (this.#running) return;
		this.#running = true;
		try {
			await this.#applyEdits();
		} finally {
			this.#running = false;
		}
	}

	// ── Core algorithm ───────────────────────────────────────────────────────────

	async #applyEdits() {
		this.#element.setAttribute("cursor", "typing");
		while (this.#currentText !== this.#targetText) {
			const edit = this.#findNextEdit();
			if (!edit) break;

			await this.#moveCursorTo(edit.position);
			await this.#pause(this.thinkTime);

			if (edit.type === "delete") {
				await this.#deleteChars(edit.count);
			} else {
				await this.#typeChars(edit.chars);
			}
		}
		this.#element.setAttribute("cursor", "waiting");
	}

	/**
	 * Computes the next atomic edit (delete | insert) closest to the cursor.
	 *
	 * Strategy:
	 *  - Build the LCS of current vs. target to find which characters are "kept".
	 *  - Walk the diff to collect all pending deletions and insertions (with their
	 *    positions in the current string).
	 *  - Return whichever pending edit position is nearest to #cursorPos.
	 */
	#findNextEdit() {
		const cur = this.#currentText;
		const tgt = this.#targetText;

		if (cur === tgt) return null;

		const diff = this.#computeDiff(cur, tgt);

		// Gather contiguous runs of deletions/insertions
		const edits = [];
		let i = 0; // index into `cur` as we walk the diff

		let j = 0;
		while (j < diff.length) {
			const op = diff[j];

			if (op.type === "keep") {
				i += op.text.length;
				j++;
			} else if (op.type === "delete") {
				edits.push({
					type: "delete",
					position: i + op.text.length,
					count: op.text.length,
				});
				i += op.text.length;
				j++;
			} else if (op.type === "insert") {
				edits.push({ type: "insert", position: i, chars: op.text });
				j++;
			}
		}

		if (edits.length === 0) return null;

		// Pick the edit whose relevant cursor position is nearest to #cursorPos
		return edits.reduce((best, e) => {
			const pos = e.type === "delete" ? e.position : e.position;
			const bestPos = best.type === "delete" ? best.position : best.position;
			return Math.abs(pos - this.#cursorPos) <
				Math.abs(bestPos - this.#cursorPos)
				? e
				: best;
		});
	}

	/**
	 * Classic linear-space LCS-based diff.
	 * Returns an array of { type: "keep"|"delete"|"insert", text: string }.
	 */
	#computeDiff(a, b) {
		// DP table — only store two rows
		const m = a.length,
			n = b.length;
		const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

		for (let i = m - 1; i >= 0; i--) {
			for (let j = n - 1; j >= 0; j--) {
				dp[i][j] =
					a[i] === b[j]
						? dp[i + 1][j + 1] + 1
						: Math.max(dp[i + 1][j], dp[i][j + 1]);
			}
		}

		// Trace back
		const ops = [];
		let i = 0,
			j = 0;
		while (i < m || j < n) {
			if (i < m && j < n && a[i] === b[j]) {
				this.#appendOp(ops, "keep", a[i]);
				i++;
				j++;
			} else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
				this.#appendOp(ops, "insert", b[j]);
				j++;
			} else {
				this.#appendOp(ops, "delete", a[i]);
				i++;
			}
		}
		return ops;
	}

	/** Append a character to the last op if same type, else push new op. */
	#appendOp(ops, type, char) {
		if (ops.length && ops[ops.length - 1].type === type) {
			ops[ops.length - 1].text += char;
		} else {
			ops.push({ type, text: char });
		}
	}

	// ── Animated primitives ──────────────────────────────────────────────────────

	async #moveCursorTo(target) {
		const step = target > this.#cursorPos ? 1 : -1;
		while (this.#cursorPos !== target) {
			this.#cursorPos += step;
			this.#render();
			await this.#pause(this.movingSpeed);
		}
	}

	async #deleteChars(count) {
		for (let k = 0; k < count; k++) {
			if (this.#cursorPos === 0) break;
			const t = this.#currentText;
			this.#element.textContent =
				t.slice(0, this.#cursorPos - 1) + t.slice(this.#cursorPos);
			this.#cursorPos--;
			this.#render();
			await this.#pause(this.deletingSpeed);
		}
	}

	async #typeChars(chars) {
		for (const ch of chars) {
			const t = this.#currentText;
			this.#element.textContent =
				t.slice(0, this.#cursorPos) + ch + t.slice(this.#cursorPos);
			this.#cursorPos++;
			this.#render();
			await this.#pause(this.writingSpeed);
		}
	}

	// ── Helpers ──────────────────────────────────────────────────────────────────

	get #currentText() {
		return this.#element.textContent.toUpperCase();
	}

	/** Re-render the text with a visible cursor caret. */
	#render() {
		this.#element.setAttribute(
			"before-cursor",
			this.#currentText.slice(0, this.#cursorPos),
		);
	}

	#pause(ms) {
		return new Promise((r) => setTimeout(r, ms));
	}

	// ── Styles ─────────────────────────────────────────────────────────────────

	/** Call once to inject CSS for cursor styling. */
	#injectStyles() {
		const styleSheet = document.createElement("style");
		styleSheet.textContent = `
			.textWriter::before {
				content: attr(before-cursor);
				position: absolute;
				border-right: solid 0.075rem transparent;
				animation: none;
				color: transparent;
				height: 1em;
				align-self: center;
			}

			.textWriter[cursor="waiting"]::before {
				animation: blink 1s infinite;
				border-color: white;
			}

			.textWriter[cursor="typing"]::before {
				animation: none;
				border-color: white;
			}

			@keyframes blink {
				0%,
				50% {
					border-color: white;
				}
				51%,
				100% {
					border-color: transparent;
				}
			}
		`;
		document.head.appendChild(styleSheet);
	}
}
