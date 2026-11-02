import test from 'node:test';
import assert from 'node:assert/strict';
import {sortPosts,tweetMarkup,announcementPost} from '../src/tweet-content.js';
test('pinned posts sort above newer ordinary posts without mutating input',()=>{
 const posts=[{id:'new',created_at:'2026-11-02'},{id:'pin',is_pinned:true,created_at:'2026-10-01'}];assert.equal(sortPosts(posts)[0].id,'pin');assert.equal(posts[0].id,'new');
});
test('published attachments are linked safely; hidden or missing files are unavailable',()=>{
 const markup=tweetMarkup({id:'p',body:'<script>bad</script>',created_at:'2026-11-02',material_ids:['a','b','gone']},[{id:'a',title:'Notes <one>'},{id:'b',title:'Hidden',published:false}]);
 assert.match(markup,/&lt;script&gt;/);assert.match(markup,/Notes &lt;one&gt;/);assert.match(markup,/data-note-material="a"/);assert.doesNotMatch(markup,/data-note-material="b"/);assert.equal(markup.match(/Material unavailable/g).length,2);
});
test('preview attachments have no live navigation actions',()=>{
 assert.doesNotMatch(tweetMarkup({body:'Preview',material_ids:['a']},[{id:'a',title:'PDF'}],{interactive:false}),/data-note-material/);
});
test('announcement expires at exactly 24 hours and newest enabled post wins',()=>{
 const now=Date.parse('2026-11-02T12:00:00Z'),posts=[{id:'expired',show_announcement:true,created_at:'2026-11-01T12:00:00Z'},{id:'old',show_announcement:true,created_at:'2026-11-02T09:00:00Z'},{id:'new',show_announcement:true,created_at:'2026-11-02T11:00:00Z'},{id:'off',created_at:'2026-11-02T11:30:00Z'},{id:'future',show_announcement:true,created_at:'2026-11-03T12:00:00Z'}];
 assert.equal(announcementPost(posts,now).id,'new');assert.equal(announcementPost([posts[0]],now),null);
});
