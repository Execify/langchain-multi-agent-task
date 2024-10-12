<script>
	import '../app.css';
</script>

<div class="flex flex-row justify-center w-full min-h-screen bg-slate-200">
    <div class="max-w-full w-full lg:max-w-6/12 p-4">
        <div class="bg-white rounded-md p-4 shadow-md">
            <slot />
        </div>
    </div>
</div>
