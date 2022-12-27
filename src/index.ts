
import "@logseq/libs";
import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user";
import axios from 'axios';

const DEVMODE = true;

let settings: SettingSchemaDesc[] = [{
  key: "LinearAPIKey",
  type: "string",
  title: "Your Linear API Key",
  description: "Create it by going to your workspace settings, Account > API. Enter a label like 'Logseq' and create the key. Copy it here.",
  default: ''
},
]

function findLinearIssue(id: string, apiKey: string): Promise<string> {

  return new Promise((resolve, reject) => {
    axios.post('https://api.linear.app/graphql', {
      query: `query GetIssue($issueId: String!) {issue(id: $issueId) {title url}}`,
      variables: {
        issueId: `${id}`
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey

      }
    }).then(data => resolve(data.data)).catch(reject)
  })
}

function main() {


  if (DEVMODE) {
    logseq.App.showMsg('🌗 Loaded!');
  }

  logseq.useSettingsSchema(settings);

  logseq.Editor.registerSlashCommand(
    '🌗 Extract Linear Issue',
    async (e) => {
      const block = await logseq.Editor.getBlock(e.uuid);

      if (block?.uuid !== e.uuid) {
        logseq.App.showMsg('🌗 Please select the block you want to extract the Linear issue from');
        return;
      }

      if (block) {
        const { content } = block
        // const { content, uuid } = block
        const linearMatchingId = content.match(/([A-Z]+-\d+)/);
        if (linearMatchingId?.[1]) {
          const linearUrl = linearMatchingId[1]
          if (linearUrl) {

            if (!logseq.settings?.LinearAPIKey) {
              logseq.App.showMsg('No Linear API Key found in settings');
              return;
            }


            try {
              const res = await findLinearIssue(linearUrl, logseq.settings.LinearAPIKey);
              const formattedData = (res as unknown) as { data: { issue: { title: string, url: string } } };
              logseq.Editor.insertBlock(e.uuid, `#### ${formattedData.data.issue.title}\n[${formattedData.data.issue.url}](${formattedData.data.issue.url})`)
            }
            catch (err) {

              logseq.Editor.insertBlock(e.uuid, JSON.stringify(err));
            }



          }
        }
        else {
          if (DEVMODE) {
            logseq.Editor.insertBlock(e.uuid, `No Linear ID found in this block: ${content}`)
          }
          else {
            logseq.App.showMsg(`No Linear ID found in this block ${content}`)
          }
        }
      }


    },
  )

  // logseq.Editor.registerBlockContextMenuItem('🦜 Send A Tweet',
  //   ({ blockId }) => {
  //     logseq.App.showMsg(
  //       '🦜 Tweet from block content #' + blockId,
  //     )
  //   })
}
// bootstrap
logseq.ready(main).catch(console.error)
