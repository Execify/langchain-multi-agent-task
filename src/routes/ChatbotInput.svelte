<script lang="ts">
	import { createEventDispatcher } from "svelte";

    export let isWaitingForResponse: boolean;

    let message = 'Can you tell me one fact about cats and marketing?';

    const dispatch = createEventDispatcher()

    const sendMessage = () => {
        if (message === '') return;
        
        dispatch("sendMessage", message)
        message = ''
    }
</script>

<div class="flex flex-row gap-2 pt-2">
    <input
        type="text"
        class="flex-grow p-2 rounded-md border border-slate-300 focus:outline-primary-300"
        placeholder="Type your message here..."
        bind:value={message}
        on:keydown={(e) => e.key === 'Enter' && sendMessage()}
        disabled={isWaitingForResponse}
    />
    <button 
        type="button"
        class="py-2 px-6 bg-primary-500 text-white rounded-md shadow-md font-bold disabled:opacity-50"
        on:click={sendMessage}
        disabled={isWaitingForResponse}
    >
        Send
    </button>
</div>