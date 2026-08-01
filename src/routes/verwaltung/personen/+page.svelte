<script lang="ts">
	import { enhance } from '$app/forms';
	import { ALL_ROLES, ROLE_HINTS, ROLE_LABELS, displayName, sortRoles } from '$lib/roles';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Welche Zeile gerade aufgeklappt ist. Eine ausklappbare Zeile statt einer Detailseite:
	// Rollen zu setzen heißt, sie mit denen der anderen zu vergleichen, und dafür muss die
	// Liste stehen bleiben.
	let editing = $state<string | null>(null);
</script>

<div class="flex flex-col gap-4">
	<div>
		<h1 class="text-2xl font-semibold">Personen und Rollen</h1>
		<p class="text-base-content/80 text-sm">
			Wer sich bei Tallox anmelden darf, und was er oder sie dann tun kann. Ohne Eintrag hier kommt
			niemand hinein — auch nicht mit gültiger HM-Kennung.
		</p>
	</div>

	{#if form && 'error' in form && form.error}
		<div class="border-base-300 bg-base-100 rounded-lg border p-4">
			<p class="text-base-content/90 text-sm">
				<span class="badge badge-error badge-sm align-middle">Nicht gespeichert</span>
				{form.error}
			</p>
		</div>
	{/if}

	<div class="border-base-300 bg-base-100 rounded-lg border p-4">
		<h2 class="mb-2 flex items-center gap-2 font-medium">
			<span aria-hidden="true">➕</span> Person anlegen
		</h2>
		<p class="text-base-content/80 mb-3 text-sm">
			Die Mailadresse genügt — es muss die sein, die die HM-Anmeldung liefert. Name und Rollen
			kommen danach; eine neu angelegte Person hat noch gar keine.
		</p>

		<form method="POST" action="?/create" use:enhance class="grid grid-cols-1 gap-3 sm:grid-cols-3">
			<label class="form-control sm:col-span-1">
				<span class="label-text text-sm">Mailadresse</span>
				<input
					name="mail"
					type="email"
					required
					autocomplete="off"
					placeholder="vorname.nachname@hm.edu"
					class="input input-bordered input-sm w-full"
				/>
			</label>
			<label class="form-control sm:col-span-1">
				<span class="label-text text-sm">Name (optional)</span>
				<input
					name="name"
					type="text"
					autocomplete="off"
					class="input input-bordered input-sm w-full"
				/>
			</label>
			<div class="flex items-end">
				<button type="submit" class="btn btn-sm btn-primary">Anlegen</button>
			</div>
		</form>
	</div>

	<form method="GET" class="flex flex-wrap items-end gap-3">
		<label class="form-control">
			<span class="label-text text-sm">Suchen</span>
			<input
				name="q"
				type="search"
				value={data.search}
				placeholder="Name oder Adresse"
				class="input input-bordered input-sm"
			/>
		</label>
		<label class="flex items-center gap-2 pb-1 text-sm">
			<input
				name="inaktiv"
				type="checkbox"
				value="1"
				checked={data.includeInactive}
				class="checkbox checkbox-sm"
			/>
			Deaktivierte anzeigen
		</label>
		<button type="submit" class="btn btn-sm">Anwenden</button>
	</form>

	<div class="border-base-300 bg-base-100 overflow-x-auto rounded-lg border">
		<table class="table table-sm">
			<thead>
				<tr>
					<th>Person</th>
					<th>Rollen</th>
					<th class="text-right">Ändern</th>
				</tr>
			</thead>
			<tbody>
				{#each data.people as person (person.id)}
					<tr>
						<td>
							<div class="font-medium">{displayName(person)}</div>
							{#if person.name}
								<div class="text-base-content/80 font-mono text-xs">{person.mail}</div>
							{/if}
						</td>
						<td>
							{#if person.roles.length === 0}
								<span class="text-base-content/80 text-sm">— noch keine —</span>
							{:else}
								<div class="flex flex-wrap gap-1">
									{#each sortRoles(person.roles) as role (role)}
										<span class="badge badge-ghost badge-sm"
											>{ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}</span
										>
									{/each}
								</div>
							{/if}
						</td>
						<td class="text-right">
							<button
								class="btn btn-ghost btn-xs"
								aria-expanded={editing === person.id}
								onclick={() => (editing = editing === person.id ? null : person.id)}
							>
								{editing === person.id ? 'Schließen' : 'Bearbeiten'}
							</button>
						</td>
					</tr>

					{#if editing === person.id}
						<tr>
							<td colspan="3" class="bg-base-200/40">
								<form method="POST" action="?/roles" use:enhance class="flex flex-col gap-3 py-2">
									<input type="hidden" name="id" value={person.id} />

									<fieldset class="flex flex-col gap-1">
										<legend class="mb-1 text-sm font-medium">Rollen</legend>
										{#each ALL_ROLES as role (role)}
											<label class="flex items-start gap-2 text-sm">
												<input
													type="checkbox"
													name="roles"
													value={role}
													checked={person.roles.includes(role)}
													class="checkbox checkbox-sm mt-0.5"
												/>
												<span>
													<span class="font-medium">{ROLE_LABELS[role]}</span>
													<span class="text-base-content/80"> — {ROLE_HINTS[role]}</span>
												</span>
											</label>
										{/each}
									</fieldset>

									<label class="form-control max-w-sm">
										<span class="label-text text-sm">Befristet bis (optional)</span>
										<input
											name="expiresAt"
											type="datetime-local"
											class="input input-bordered input-sm"
										/>
										<span class="text-base-content/80 mt-1 text-xs">
											Gilt nur für Rollen, die jetzt neu dazukommen. Gedacht für „einmal
											hineinsehen“ — die Rolle läuft dann von selbst aus, statt bis Februar stehen
											zu bleiben.
										</span>
									</label>

									<div class="flex flex-wrap gap-2">
										<button type="submit" class="btn btn-sm btn-primary">Rollen speichern</button>
									</div>
								</form>

								<form method="POST" action="?/active" use:enhance class="pb-2">
									<input type="hidden" name="id" value={person.id} />
									<input type="hidden" name="active" value="0" />
									<button type="submit" class="btn btn-sm btn-outline">Konto deaktivieren</button>
									<span class="text-base-content/80 ml-2 text-xs">
										Nimmt alles auf einmal weg, Tokens eingeschlossen. Gelöscht wird nie — die
										Zuteilungen bleiben in der Historie.
									</span>
								</form>
							</td>
						</tr>
					{/if}
				{:else}
					<tr>
						<td colspan="3" class="text-base-content/80 text-sm">
							Niemand gefunden.
							{#if !data.includeInactive}
								Deaktivierte Konten sind ausgeblendet.
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
