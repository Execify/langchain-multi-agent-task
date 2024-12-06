<script lang="ts">
    export let tasks: Array<{ id: number, task: string, completed: boolean, notes: string }>;
</script>

<div class="flex flex-row gap-2">
    <div class="flex flex-col w-3/5">
        <div class="px-4 py-2 rounded-md shadow-md bg-primary-100 text-primary-950 shadow-primary-200">
            <table class="min-w-full">
                <thead>
                    <tr>
                        <th class="text-left py-2">ID</th>
                        <th class="text-left py-2">Task</th>
                        <th class="text-left py-2">Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tasks as task}
                        <tr>
                            <td class="border-t py-2">{task.id}</td>
                            <td class="border-t py-2">{task.task}</td>
                            <td class="border-t py-2">{task.notes !== '[]' ? JSON.parse(task.notes).join(', ') : ''}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div> 