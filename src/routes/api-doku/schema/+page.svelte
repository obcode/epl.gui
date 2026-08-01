<script lang="ts">
	import { resolve } from '$app/paths';
	import { anchorFor, describeBlocks, inlineSegments, type SchemaType } from '$lib/schemaDoc';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const all = $derived([...data.doc.roots, ...data.doc.types] as SchemaType[]);
</script>

<div class="flex flex-col gap-4">
	<div>
		<h1 class="text-2xl font-semibold">Schema-Referenz</h1>
		<p class="text-base-content/80 text-sm">
			Erzeugt aus dem Schema des Servers, nicht von Hand geschrieben — sie kann also nicht veralten.
			Zurück zur <a class="link" href={resolve('/api-doku')}>API-Dokumentation</a>.
		</p>
	</div>

	<nav class="border-base-300 bg-base-100 rounded-lg border p-4" aria-label="Typen">
		<h2 class="mb-2 font-medium">Typen</h2>
		<ul class="flex flex-wrap gap-2">
			{#each all as type (type.name)}
				<li>
					<a class="badge badge-outline hover:badge-primary" href="#{anchorFor(type.name)}">
						{type.name}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	{#each all as type (type.name)}
		<section id={anchorFor(type.name)} class="border-base-300 bg-base-100 rounded-lg border p-4">
			<h2 class="flex items-center gap-2 font-medium">
				<span class="font-mono">{type.name}</span>
				<span class="badge badge-ghost badge-sm">{type.kind}</span>
			</h2>

			<!-- Absätze statt whitespace-pre-line: die Umbrüche im Schema sitzen dort, wo der
			     Quelltext umbricht, nicht wo der Browser umbrechen würde. describeBlocks()
			     macht daraus wieder Absätze; die Leerzeile zwischen zweien bleibt eine Aussage. -->
			{#each describeBlocks(type.description) as block, index (index)}
				{#if block.kind === 'code'}
					<pre class="bg-base-200 mt-2 overflow-x-auto rounded p-2 text-xs">{block.text}</pre>
				{:else}
					<p class="text-base-content/90 mt-2 text-sm">
						{#each inlineSegments(block.text) as segment, part (part)}{#if segment.code}<code
									class="bg-base-200 rounded px-1 font-mono text-xs">{segment.text}</code
								>{:else}{segment.text}{/if}{/each}
					</p>
				{/if}
			{/each}

			{#if type.fields.length > 0}
				<div class="mt-3 overflow-x-auto">
					<table class="table text-sm">
						<thead>
							<tr>
								<th>Feld</th>
								<th>Typ</th>
								<th>Beschreibung</th>
							</tr>
						</thead>
						<tbody>
							{#each type.fields as field (field.name)}
								<tr>
									<td class="align-top font-mono whitespace-nowrap">
										{field.name}
										{#if field.args.length > 0}
											<div class="text-base-content/80 text-xs">
												{#each field.args as arg (arg.name)}
													<div>{arg.name}: {arg.type}</div>
												{/each}
											</div>
										{/if}
									</td>
									<td class="align-top font-mono whitespace-nowrap">{field.type}</td>
									<td class="align-top">
										{#if field.deprecationReason}
											<span class="badge badge-warning badge-sm">veraltet</span>
											<span class="text-base-content/90">{field.deprecationReason}</span>
										{/if}
										{#each describeBlocks(field.description) as block, index (index)}
											{#if block.kind === 'code'}
												<pre
													class="bg-base-200 mt-1 overflow-x-auto rounded p-2 text-xs">{block.text}</pre>
											{:else}
												<div class="text-base-content/90 not-first:mt-2">
													{#each inlineSegments(block.text) as segment, part (part)}{#if segment.code}<code
																class="bg-base-200 rounded px-1 font-mono text-xs"
																>{segment.text}</code
															>{:else}{segment.text}{/if}{/each}
												</div>
											{/if}
										{/each}
										{#each field.args as arg (arg.name)}
											{#if arg.description}
												<div class="text-base-content/80 mt-1 text-xs">
													<span class="font-mono">{arg.name}</span> — {arg.description}
												</div>
											{/if}
										{/each}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			{#if type.values.length > 0}
				<ul class="mt-3 flex flex-col gap-1 text-sm">
					{#each type.values as value (value.name)}
						<li>
							<span class="font-mono">{value.name}</span>
							{#if value.description}
								<span class="text-base-content/90">— {value.description}</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}
</div>
