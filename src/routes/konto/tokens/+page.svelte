<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { expiresIn, formatMoment, STATUS_BADGE, STATUS_LABEL, tokenStatus } from '$lib/tokens';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Das frisch erzeugte Token lebt ausschließlich in dieser Variablen, bis die Seite neu
	// geladen wird. Es wird nicht in localStorage gelegt und nicht in die URL geschrieben:
	// beides überlebt den Moment, für den es gedacht ist.
	const created = $derived(form && 'created' in form ? form.created : null);
	const refusal = $derived(form && 'message' in form ? form : null);

	let copied = $state(false);

	async function copySecret(secret: string) {
		await navigator.clipboard.writeText(secret);
		copied = true;
		setTimeout(() => (copied = false), 3000);
	}
</script>

<div class="flex flex-col gap-4">
	<div>
		<h1 class="text-2xl font-semibold">Personal Access Tokens</h1>
		<p class="text-base-content/80 text-sm">
			Für eigene Auswertungen gegen die Tallox-API — aus einem Skript, einem Notebook oder einem
			Cronjob. Wie man sie benutzt, steht in der <a class="link" href={resolve('/api-doku')}
				>API-Dokumentation</a
			>.
		</p>
	</div>

	{#if created}
		<!-- Der einzige Moment, in dem das Secret existiert. Deshalb steht es oben, in einem
		     eigenen Kasten, und die Seite sagt ausdrücklich, dass es nicht wiederkommt. -->
		<div class="border-success bg-base-100 flex flex-col gap-3 rounded-lg border-2 p-4">
			<div>
				<h2 class="flex items-center gap-2 font-medium">
					<span aria-hidden="true">🔑</span> Token angelegt: {created.token.description}
				</h2>
				<p class="text-base-content/90 text-sm">
					Jetzt kopieren — das Token wird <strong>nicht wieder angezeigt</strong>. Tallox speichert
					davon nur eine Prüfsumme. Verloren? Dann hier widerrufen und ein neues anlegen.
				</p>
			</div>

			<div class="flex flex-col gap-2 sm:flex-row">
				<!-- readonly statt disabled: der Wert bleibt auswählbar und für Screenreader
				     erreichbar, lässt sich aber nicht versehentlich ändern. -->
				<input
					class="input input-bordered w-full font-mono text-sm"
					value={created.secret}
					readonly
					aria-label="Neues Token"
					onfocus={(event) => event.currentTarget.select()}
				/>
				<button class="btn btn-primary" onclick={() => copySecret(created.secret)}>
					{copied ? 'Kopiert' : 'Kopieren'}
				</button>
			</div>
		</div>
	{/if}

	{#if refusal}
		<div class="border-base-300 bg-base-100 rounded-lg border p-4">
			<p class="text-base-content/90 text-sm">
				<span class="badge badge-error badge-sm align-middle">Fehlgeschlagen</span>
				{refusal.message}
			</p>
		</div>
	{/if}

	<div class="border-base-300 bg-base-100 rounded-lg border p-4">
		<h2 class="mb-2 flex items-center gap-2 font-medium">
			<span aria-hidden="true">➕</span> Neues Token
		</h2>

		<form method="POST" action="?/create" use:enhance class="flex flex-col gap-3 sm:flex-row">
			<label class="flex flex-1 flex-col gap-1">
				<span class="text-base-content/90 text-sm">Wofür?</span>
				<input
					class="input input-bordered w-full"
					name="description"
					required
					maxlength="200"
					placeholder="z. B. Auswertung Deputat im Notebook"
					value={refusal?.description ?? ''}
				/>
			</label>

			<label class="flex flex-col gap-1 sm:w-48">
				<span class="text-base-content/90 text-sm">Gültig für (Tage)</span>
				<input
					class="input input-bordered w-full"
					name="expiresInDays"
					type="number"
					min="1"
					max="365"
					placeholder="90"
				/>
			</label>

			<button class="btn btn-primary self-end">Anlegen</button>
		</form>
	</div>

	<div class="border-base-300 bg-base-100 rounded-lg border p-4">
		<h2 class="mb-2 flex items-center gap-2 font-medium">
			<span aria-hidden="true">📋</span> Meine Tokens
		</h2>

		{#if data.tokens.length === 0}
			<p class="text-base-content/80 text-sm">Noch keine Tokens angelegt.</p>
		{:else}
			<!-- Breite Tabellen leben in overflow-x-auto, damit die Seite bei 375px nicht
			     seitlich wandert. -->
			<div class="overflow-x-auto">
				<table class="table-zebra table text-sm">
					<thead>
						<tr>
							<th>Beschreibung</th>
							<th>Status</th>
							<th>Angelegt</th>
							<th>Läuft ab</th>
							<th>Zuletzt benutzt</th>
							<th><span class="sr-only">Aktion</span></th>
						</tr>
					</thead>
					<tbody>
						{#each data.tokens as token (token.id)}
							{@const status = tokenStatus(token)}
							<tr>
								<td>
									<div>{token.description}</div>
									<div class="text-base-content/80 font-mono text-xs">{token.id}</div>
								</td>
								<td>
									<span class="badge badge-sm {STATUS_BADGE[status]}">{STATUS_LABEL[status]}</span>
								</td>
								<td class="whitespace-nowrap">{formatMoment(token.createdAt)}</td>
								<td class="whitespace-nowrap">
									{formatMoment(token.expiresAt)}
									{#if status === 'active'}
										<div class="text-base-content/80 text-xs">{expiresIn(token.expiresAt)}</div>
									{/if}
								</td>
								<td class="whitespace-nowrap">{formatMoment(token.lastUsedAt)}</td>
								<td>
									{#if status !== 'revoked'}
										<form method="POST" action="?/revoke" use:enhance>
											<input type="hidden" name="id" value={token.id} />
											<button class="btn btn-ghost btn-xs">Widerrufen</button>
										</form>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<p class="text-base-content/80 mt-3 text-sm">
			Ein Token kann nie mehr als die Person, der es gehört. Wer eine Rolle verliert, verliert sie
			damit auch in jedem seiner Tokens — sofort und ohne dass ein Token angefasst werden muss.
		</p>
	</div>
</div>
