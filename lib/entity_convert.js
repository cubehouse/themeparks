// table of new entity Ids to old entity Ids
const replacements = [
  {
    old: 'WaltDisneyWorldMagicKingdom_136550',
    new: 'e8f0b426-7645-4ea3-8b41-b94ae7091a41',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_15743682',
    new: 'b5d6d1d1-e960-4c8f-a8a4-b9748b386b64',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_16124144',
    new: '6fd1e225-53a0-4a80-a577-4bbc9a471075',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_16491297',
    new: '924a3b2c-6b4b-49e5-99d3-e9dc3f2e8a48',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_16491299',
    new: 'e40ac396-cbac-43f4-8752-764ed60ccceb',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_16660079',
    new: 'e847a8bd-7d21-432b-a7a1-f483517a22b5',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_16767263',
    new: '3cba0cb4-e2a6-402c-93ee-c11ffcb127ef',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_16767276',
    new: 'e76c93df-31af-49a5-8e2f-752c76c937c9',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_16767284',
    new: '9d4d5229-7142-44b6-b4fb-528920969a2c',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_16874126',
    new: '012a211b-4c91-451c-8a0e-5e3ab398eda8',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_17272158',
    new: 'de737ffc-306b-4f32-8bbb-34e5d370ec8f',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_17505397',
    new: 'cf4b2ba4-3626-4de7-9d07-abe8a65b1665',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_17752793',
    new: 'd7be7f21-4077-4172-b22d-875d26191126',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_18185631',
    new: '6ea670b8-3097-4d60-b69c-94e16071da17',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_18498503',
    new: '40737d3d-0ff6-4a9e-a050-beb87bf90120',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_2219610',
    new: '06c599f9-1ddf-4d47-9157-a992acafc96b',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_387133',
    new: '166f2985-7b27-4eff-a8b3-29c3448ba198',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010107',
    new: 'd9d12438-d999-4482-894b-8955fdb20ccf',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010110',
    new: 'de3309ca-97d5-4211-bffe-739fed47e92f',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010114',
    new: '72c7343a-f7fb-4f66-95df-c91016de7338',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010117',
    new: '273ddb8d-e7b5-4e34-8657-1113f49262a5',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010129',
    new: '890fa430-89c0-4a3f-96c9-11597888005e',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010149',
    new: 'f5aad2d4-a419-4384-bd9a-42f86385c750',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010153',
    new: '796b0a25-c51e-456e-9bb8-50a324e301b3',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010160',
    new: '15700490-3749-45cf-a737-3cba56e13704',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010162',
    new: '0aae716c-af13-4439-b638-d75fb1649df3',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010165',
    new: '888fb4a4-7adf-47a1-8ba2-c258cc64fd75',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010170',
    new: '7c5e1e02-3a44-4151-9005-44066d5ba1da',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010176',
    new: '86a41273-5f15-4b54-93b6-829f140e5161',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010177',
    new: '352feb94-e52e-45eb-9c92-e4b44c6b1a9d',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010190',
    new: 'b2260923-9315-40fd-9c6b-44dd811dbe64',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010192',
    new: 'a5241f3b-4ab5-4902-b5ba-435132ef553d',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010196',
    new: '30fe3c64-af71-4c66-a54b-aa61fd7af177',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010208',
    new: '2551a77d-023f-4ab1-9a19-8afec0190f39',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010210',
    new: '96455de6-f4f1-403c-9391-bf8396979149',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010213',
    new: '0d94ad60-72f0-4551-83a6-ebaecdd89737',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010220',
    new: '4bef7560-ed81-47c7-b178-6544abe3daaf',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010222',
    new: 'f163ddcd-43e1-488d-8276-2381c1db0a39',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010224',
    new: 'ffcfeaa2-1416-4920-a1ed-543c1a1695c4',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010230',
    new: 'e39b831b-7731-49bb-815b-289b4f49a9fd',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80010232',
    new: '8183f3f2-1b59-4b9c-b634-6a863bdf8d84',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80069748',
    new: '0f57cecf-5502-4503-8bc3-ba84d3708ace',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_80069754',
    new: '2ebfb38c-5cb5-4de1-86c0-f7af14188022',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_90001819',
    new: 'ae9a4a79-ccf1-4561-9a95-cf83d3007b98',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_90002464',
    new: '55bdcccc-217b-416c-b8b0-4b6a87d16179',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_90002660',
    new: 'c4b64a31-e855-46a9-9d1a-aa13c99e88af',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_90002670',
    new: '75d43698-162c-47af-a607-e879637dc8e7',
  },
  {
    old: 'WaltDisneyWorldMagicKingdom_90002678',
    new: '83201c33-ce99-45ae-a595-f47e61d73739',
  },
  {
    old: 'WaltDisneyWorldEpcot_107785',
    new: 'fb076275-0570-4d62-b2a9-4d6515130fa3',
  },
  {
    old: 'WaltDisneyWorldEpcot_15525573',
    new: '5b7cf10a-763b-45ba-9049-87140270826f',
  },
  {
    old: 'WaltDisneyWorldEpcot_17564219',
    new: '33bd3bad-6803-4c5e-97ac-f7e31261a604',
  },
  {
    old: 'WaltDisneyWorldEpcot_17720675',
    new: 'dbf4a977-a7b5-41db-a9b7-ecad65f9aa0f',
  },
  {
    old: 'WaltDisneyWorldEpcot_18269694',
    new: '35ed719b-f7f0-488f-8346-4fbf8055d373',
  },
  {
    old: 'WaltDisneyWorldEpcot_18375495',
    new: '8d7ccdb1-a22b-4e26-8dc8-65b1938ed5f0',
  },
  {
    old: 'WaltDisneyWorldEpcot_19463785',
    new: '8c8cd77d-97f6-4309-b285-42aad90e9f15',
  },
  {
    old: 'WaltDisneyWorldEpcot_19473173',
    new: '482169b9-2889-4747-8aef-f9d13a37d940',
  },
  {
    old: 'WaltDisneyWorldEpcot_20194',
    new: '81b15dfd-cf6a-466f-be59-3dd65d2a2807',
  },
  {
    old: 'WaltDisneyWorldEpcot_207395',
    new: '22f48b73-01df-460e-8969-9eb2b4ae836c',
  },
  {
    old: 'WaltDisneyWorldEpcot_62992',
    new: '57acb522-a6fc-4aa4-a80e-21f21f317250',
  },
  {
    old: 'WaltDisneyWorldEpcot_80010145',
    new: '00666fe9-7774-4b53-9fb7-3d333f8aa503',
  },
  {
    old: 'WaltDisneyWorldEpcot_80010152',
    new: '75449e85-c410-4cef-a368-9d2ea5d52b58',
  },
  {
    old: 'WaltDisneyWorldEpcot_80010161',
    new: '8f353879-d6ac-4211-9352-4029efb47c18',
  },
  {
    old: 'WaltDisneyWorldEpcot_80010173',
    new: '5b6475ad-4e9a-4793-b841-501aa382c9c0',
  },
  {
    old: 'WaltDisneyWorldEpcot_80010174',
    new: '61fb49f8-e62f-4e1c-ae0e-8ab9929037bc',
  },
  {
    old: 'WaltDisneyWorldEpcot_80010180',
    new: 'ee070d46-6a64-41c0-9f12-69dcfcca10a0',
  },
  {
    old: 'WaltDisneyWorldEpcot_80010191',
    new: '480fde8f-fe58-4bfb-b3ab-052a39d4db7c',
  },
  {
    old: 'WaltDisneyWorldEpcot_80010199',
    new: '37ae57c5-feaf-4e47-8f27-4b385be200f0',
  },
  {
    old: 'WaltDisneyWorldEpcot_80010200',
    new: '1f542745-cda1-4786-a536-5fff373e5964',
  },
  {
    old: 'WaltDisneyWorldEpcot_90001292',
    new: 'c9e1d1f6-021f-43f2-a14b-3e67f65adbc4',
  },
  {
    old: 'WaltDisneyWorldEpcot_90001416',
    new: '38892221-f69c-4913-97c9-7473c88854fa',
  },
  {
    old: 'WaltDisneyWorldEpcot_90001798',
    new: '3206e3a6-cbc3-4960-9700-163764bc47d6',
  },
  {
    old: 'WaltDisneyWorldEpcot_90002084',
    new: '6ecdbfc8-85c2-436d-893b-6db0f437b74a',
  },
  {
    old: 'WaltDisneyWorldEpcot_90002100',
    new: '07263f57-0431-4da2-a8b6-77d2965a6f83',
  },
  {
    old: 'WaltDisneyWorldEpcot_90002237',
    new: 'd4179c4c-eb08-4559-aa7c-f9802fda641b',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_136',
    new: 'ff0de1ba-03a2-4eb3-b6da-bdbb8975f086',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_17842841',
    new: 'd91a0e9a-8652-4036-822f-e7b12b381273',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_18189394',
    new: '0e38399f-2666-422c-a315-942105d3a8a7',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_18189398',
    new: 'e6fed1a4-caca-4af4-b2ed-32686fdaa7a3',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_18360041',
    new: '97e0cc07-cf2b-4d28-941a-beff79f21543',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_18368385',
    new: '27f9fc86-2341-4bf4-8cbf-67fc16a841f1',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_18368386',
    new: '02861a9b-584d-47d5-a8d0-98e05c3b5dce',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_18669338',
    new: 'c3829334-4ab7-4e71-b832-89ddfe12ff68',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_18770880',
    new: 'd7669edc-eaa1-4af2-bbb5-6e98df564166',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_18904138',
    new: '399aa0a1-98e2-4d2b-b297-2b451e9665e1',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_18904172',
    new: 'd56506e2-6ad3-443a-8065-fea37987248d',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_19152250',
    new: '0dd79157-a449-418e-b374-99907c67fe18',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_19259335',
    new: '6e118e37-5002-408d-9d88-0b5d9cdb5d14',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_19263735',
    new: '34c4916b-989b-4ff1-a7e3-a6a846a3484f',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_19263736',
    new: '1a2e70d9-50d5-4140-b69e-799e950f7d18',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_19267226',
    new: 'f020b5e3-d26d-4339-83f9-0f1f858a0e40',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_19276204',
    new: '5262e79e-8553-4ec0-a832-3177d377136d',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_19497952',
    new: '9211adc9-b296-4667-8e97-b40cf76108e4',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_19583373',
    new: 'c35fd0d8-3a15-4609-8edf-92204c20d0e6',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_202731',
    new: '3c37037f-da2a-43d1-85c1-28df8e29a707',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_209857',
    new: '20b5daa8-e1ea-436f-830c-2d7d18d929b5',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_80010151',
    new: '76dfa347-94bb-4552-b183-a08490c54acc',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_80010182',
    new: 'e516f303-e82d-4fd3-8fbf-8e6ab624cf89',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_80010193',
    new: '3b290419-8ca2-44bc-a710-a6c83fca76ec',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_80010218',
    new: '6f6998e8-a629-412c-b964-2cb06af8e26b',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_80010848',
    new: '375197ac-27ac-41f7-bd93-f4e9b9fc4d5d',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_80010896',
    new: '449ac85d-192c-49ef-8f07-26acd91252ef',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_90001216',
    new: 'c600282c-227b-4ffc-b1ee-b5987609ee4f',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_90001744',
    new: '7bf05bdc-8279-427b-8a6d-50fc62ef31cb',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_90001865',
    new: '60faffdd-b899-4464-9059-6f4f5e54747f',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_90002114',
    new: 'd9dbd260-9e34-406d-abb7-19f9d733e577',
  },
  {
    old: 'WaltDisneyWorldHollywoodStudios_90002245',
    new: '917783a5-da9c-4c55-ac51-0ac1f8253131',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_17421326',
    new: '13d7c9d1-a785-403d-9ba8-71fee2f02d55',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_18069632',
    new: 'e12fb6d6-0985-44e5-bdd3-65ff74433063',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_18665185',
    new: '7a5af3b7-9bc1-4962-92d0-3ea9c9ce35f0',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_18665186',
    new: '24cf863c-b6ba-4826-a056-0b698989cbf7',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_19330300',
    new: '3b7309a5-7b57-4edf-b4e6-36ad958ac21e',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_26068',
    new: '64a6915f-a835-4226-ba5c-8389fc4cade3',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_80010123',
    new: '55c531b6-3ce2-4c47-a8a1-0dc9107d825b',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_80010150',
    new: 'ba44245e-5562-4359-be27-9dfb2d96cb2d',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_80010154',
    new: 'd58d9262-ec95-4161-80a0-07ca43b2f5f3',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_80010157',
    new: '32e01181-9a5f-4936-8a77-0dace1de836c',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_80010164',
    new: '1a8ea967-229a-42a0-8290-59b036c84e14',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_80010175',
    new: 'e7976e25-4322-4587-8ded-fb1d9dcbb83c',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_80010203',
    new: '43e5558e-2be0-4989-b80b-074afa8302a9',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_80010228',
    new: '1627c724-112c-4361-aeba-dae80082c90d',
  },
  {
    old: 'WaltDisneyWorldAnimalKingdom_80010235',
    new: '4f391f0e-52be-4f9d-99d6-b3ae0373b43c',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_15510732',
    new: '4f5b28d0-b78e-482b-8e2e-1f90756d6220',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_15575069',
    new: 'e1fbc7a1-2cd1-4282-b373-ac11d9d9d38a',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_15822029',
    new: 'f44a5072-3cda-4c7c-8574-33ad09d16cca',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_16514416',
    new: 'c60c768b-3461-465c-8f4f-b44b087506fc',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_16514431',
    new: '46097afe-a1ea-4807-93d3-14d14f36e55f',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_16581435',
    new: 'ead977e1-1a66-49de-b7ab-90be760b9d48',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_16588263',
    new: '1bef32e2-73b4-4de3-bb07-f71c3f301f22',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_18343088',
    new: '7a09a2f0-e226-4f3e-86f8-2598ab67ec44',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_18708628',
    new: 'cbd85f5f-27c5-41b4-94aa-d25c8883ee3c',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_19009994',
    new: '4ca6cdbf-4c5f-45bf-b0dc-db83393ec208',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_19013078',
    new: '1214912c-de6d-4493-9344-c245357f7af6',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_19269274',
    new: '463c132b-fc7d-4388-956b-13de4f98a0ad',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_19285637',
    new: '6d876f4c-c3ff-4ae3-a2d8-d4b831e1039b',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_19299875',
    new: '8f586a2f-cef5-46d3-b822-fd622c4e9e33',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_19531124',
    new: '2295351d-ce6b-4c04-92d5-5b416372c5b5',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353289',
    new: 'd2aa0987-49a2-45dc-a635-3a8bf7401230',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353303',
    new: '5d07a2b1-49ca-4de7-9d32-6d08edf69b08',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353341',
    new: '10a5fc6f-5ad3-414b-9bdd-e6bae097b6ad',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353345',
    new: 'b1d285a7-2444-4a7c-b7bb-d2d4d6428a85',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353361',
    new: 'c8a4b7b1-c1b2-4dfe-b73c-4e834b4a73db',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353367',
    new: '388ad3f1-5cf5-4a9d-8d0e-6dfb817d7822',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353379',
    new: '528016ef-db24-47fa-a0f2-b6d26d61e29f',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353387',
    new: '40524fba-5d84-49e7-9204-f493dbe2d5a4',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353413',
    new: 'c9803366-6f37-4406-82af-7692357e3ca9',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353431',
    new: '77f205a4-d482-4d91-a5ff-71e54a086ad2',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353433',
    new: '44c1f655-25d3-440c-b1a8-db736a12b105',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353451',
    new: 'b7678dab-5544-48d5-8fdc-c1a0127cfbcd',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353453',
    new: '86ab3069-110d-49c5-a7e7-29ddf28695a6',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353457',
    new: '7561bcd8-18ea-4e3f-89d5-c905b7ba3d42',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_353459',
    new: 'e69dc53f-0952-47b6-96e3-aab5cf364f94',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_354555',
    new: '048f854a-97d8-4295-8b7f-2575605259c6',
  },
  {
    old: 'DisneylandResortCaliforniaAdventure_401479',
    new: '73b3de7c-e39b-4064-9b13-e109e3b684cc',
  },
  {
    old: 'DisneylandResortMagicKingdom_18237343',
    new: 'dc508417-d28e-4bed-93e7-571dab60c5cd',
  },
  {
    old: 'DisneylandResortMagicKingdom_18237377',
    new: '6f782609-c4c5-4996-bb2d-02094e056ef5',
  },
  {
    old: 'DisneylandResortMagicKingdom_18237385',
    new: 'ffbd8f3a-abc4-4714-bce0-c9a862ddb887',
  },
  {
    old: 'DisneylandResortMagicKingdom_18738682',
    new: '33cbbd09-6d93-40d7-b758-9d7b7d3fd2eb',
  },
  {
    old: 'DisneylandResortMagicKingdom_19025523',
    new: 'da09dd79-0dc9-43b4-9368-ffdc8995b869',
  },
  {
    old: 'DisneylandResortMagicKingdom_19193459',
    new: 'b2c2549c-e9da-4fdd-98ea-1dcff596fed7',
  },
  {
    old: 'DisneylandResortMagicKingdom_19193461',
    new: '34b1d70f-11c4-42df-935e-d5582c9f1a8e',
  },
  {
    old: 'DisneylandResortMagicKingdom_19268344',
    new: 'eb29424b-42ed-41a2-891c-d4c9494eab12',
  },
  {
    old: 'DisneylandResortMagicKingdom_353291',
    new: '6c225598-91c9-44a3-95e2-7c423475db61',
  },
  {
    old: 'DisneylandResortMagicKingdom_353293',
    new: '1da85181-bf0f-4ccc-b98e-243142f7347b',
  },
  {
    old: 'DisneylandResortMagicKingdom_353295',
    new: '0de1413a-73ee-46cf-af2e-c491cc7c7d3b',
  },
  {
    old: 'DisneylandResortMagicKingdom_353301',
    new: '88197808-3c56-4198-a5a4-6066541251cf',
  },
  {
    old: 'DisneylandResortMagicKingdom_353305',
    new: '8e686e4c-f3db-4d9c-a185-2d54b1fa8899',
  },
  {
    old: 'DisneylandResortMagicKingdom_353311',
    new: '5bd95ae8-181d-449c-8f04-a621e2448961',
  },
  {
    old: 'DisneylandResortMagicKingdom_353313',
    new: '56d0bd6d-5106-4420-8f60-0005475c04c3',
  },
  {
    old: 'DisneylandResortMagicKingdom_353315',
    new: 'e2d460e9-2bef-4613-b126-092ab7cb37e5',
  },
  {
    old: 'DisneylandResortMagicKingdom_353323',
    new: 'cc980e8e-192f-48b6-848c-27784084e54b',
  },
  {
    old: 'DisneylandResortMagicKingdom_353325',
    new: '106c1e5a-a5e7-42d7-96ab-bc100d8faf71',
  },
  {
    old: 'DisneylandResortMagicKingdom_353327',
    new: '64d44aaa-6857-4693-b24b-bcff6c6dcfa1',
  },
  {
    old: 'DisneylandResortMagicKingdom_353337',
    new: '59647168-d239-4161-8b24-92eb128e96fb',
  },
  {
    old: 'DisneylandResortMagicKingdom_353347',
    new: 'ff52cb64-c1d5-4feb-9d43-5dbd429bac81',
  },
  {
    old: 'DisneylandResortMagicKingdom_353355',
    new: '2aedc657-1ee2-4545-a1ce-14753f28cc66',
  },
  {
    old: 'DisneylandResortMagicKingdom_353363',
    new: '1b83fda8-d60e-48e4-9a3d-90ddcbcd1001',
  },
  {
    old: 'DisneylandResortMagicKingdom_353365',
    new: 'f7904912-3f08-4563-b99e-fd59f43cc9f2',
  },
  {
    old: 'DisneylandResortMagicKingdom_353369',
    new: 'e0cfed11-96d7-40f3-907f-5cfed172592a',
  },
  {
    old: 'DisneylandResortMagicKingdom_353375',
    new: '6c30d5b0-8c0a-406f-9258-0b6c55d4a5e4',
  },
  {
    old: 'DisneylandResortMagicKingdom_353377',
    new: 'faaa8be9-cc1e-4535-ac20-04a535654bd0',
  },
  {
    old: 'DisneylandResortMagicKingdom_353381',
    new: '87387057-47ab-4d0b-8eed-2e6c9d23577b',
  },
  {
    old: 'DisneylandResortMagicKingdom_353389',
    new: '9d401ad3-49b2-469f-ac73-93eb429428fb',
  },
  {
    old: 'DisneylandResortMagicKingdom_353399',
    new: 'c23af6ba-8515-406a-8a48-d0818ba0bfc9',
  },
  {
    old: 'DisneylandResortMagicKingdom_353401',
    new: '90ee50d4-7cc9-4824-b29d-2aac801acc29',
  },
  {
    old: 'DisneylandResortMagicKingdom_353403',
    new: '07952343-3498-404b-8337-734de9a185c1',
  },
  {
    old: 'DisneylandResortMagicKingdom_353405',
    new: '82aeb29b-504a-416f-b13f-f41fa5b766aa',
  },
  {
    old: 'DisneylandResortMagicKingdom_353421',
    new: '6ce9cdd1-0a43-459e-83cd-f4cace9cfa7b',
  },
  {
    old: 'DisneylandResortMagicKingdom_353425',
    new: 'c9e39189-7e99-4e0a-97e0-4a0d5654d257',
  },
  {
    old: 'DisneylandResortMagicKingdom_353429',
    new: '4f0053e7-b8db-4833-b02f-35e1c91b4523',
  },
  {
    old: 'DisneylandResortMagicKingdom_353435',
    new: '9167db1d-e5e7-46da-a07f-ae30a87bc4c4',
  },
  {
    old: 'DisneylandResortMagicKingdom_353437',
    new: '343b216d-86b1-40c2-83cc-aa5f67b4804b',
  },
  {
    old: 'DisneylandResortMagicKingdom_353439',
    new: 'cc718d11-fa15-44ee-87d0-ded989ad61bc',
  },
  {
    old: 'DisneylandResortMagicKingdom_353443',
    new: 'cb929138-d77a-4dd2-983c-f651bbd1bd92',
  },
  {
    old: 'DisneylandResortMagicKingdom_353445',
    new: 'f8207ea4-c360-4652-b07a-0e12242cadf5',
  },
  {
    old: 'DisneylandResortMagicKingdom_353449',
    new: '52a8ef64-d54c-4974-883f-027c3026e3f1',
  },
  {
    old: 'DisneylandResortMagicKingdom_353461',
    new: '1b23667a-d8fb-436d-8952-c3e3f2e56d13',
  },
  {
    old: 'DisneylandResortMagicKingdom_354117',
    new: '3665b38e-3e56-4c84-ad20-3e39672079a1',
  },
  {
    old: 'DisneylandResortMagicKingdom_354450',
    new: '057872ed-3f27-496f-80e2-edd3639ba084',
  },
  {
    old: 'DisneylandResortMagicKingdom_367492',
    new: '3638ac09-9fce-4a43-8c79-8ebbe17afce2',
  },
  {
    old: 'DisneylandResortMagicKingdom_367495',
    new: 'a07f3110-013e-43bb-a182-e66bb8b5e28d',
  },
  {
    old: 'DisneylandResortMagicKingdom_401483',
    new: '8c36ff0b-3a32-4d7b-9388-0516c19277db',
  },
  {
    old: 'DisneylandResortMagicKingdom_401524',
    new: '7e621af5-8a0e-4427-912e-f49b438656da',
  },
  {
    old: 'Efteling_avonturendoolhof',
    new: '20fe68f1-821e-4d8d-92bb-e164efc1e4eb',
  },
  {
    old: 'Efteling_baron1898',
    new: 'b6b1ed81-620b-4994-a65b-e6a0a123fa0f',
  },
  {
    old: 'Efteling_carnavalfestival',
    new: '96f50f4d-0452-4d25-8763-c34d2da4353e',
  },
  {
    old: 'Efteling_carrouselsantonpieckplein',
    new: '8901e445-6667-4634-8e7c-09a31e23dc4b',
  },
  {
    old: 'Efteling_devliegendehollander',
    new: '4b4a127f-764c-4106-a705-d3c47fb8b361',
  },
  {
    old: 'Efteling_diorama',
    new: '06ff67dc-5e4e-4538-b8f2-f04f5c14e189',
  },
  {
    old: 'Efteling_doudetuffer',
    new: 'a24936b1-9400-41b3-9727-12c958a37628',
  },
  {
    old: 'Efteling_droomvlucht',
    new: 'bd02be82-ce77-4c38-8c8d-567df7810648',
  },
  {
    old: 'Efteling_eftelingmuseum',
    new: '45e6c76a-c5a2-4a18-9225-0f0e203a9f6e',
  },
  {
    old: 'Efteling_fabula',
    new: '8d1d7988-852c-4cab-a71b-d2a4ca3d9501',
  },
  {
    old: 'Efteling_fatamorgana',
    new: '5e55ad4a-d288-451f-9185-a301bc3d2757',
  },
  {
    old: 'Efteling_gamegallery',
    new: '1e3cd68e-bd7d-4f45-b7e4-7296f635f83a',
  },
  {
    old: 'Efteling_gondoletta',
    new: 'b4eedd7d-d8c4-4943-8e2c-e42d2dbffd39',
  },
  {
    old: 'Efteling_halvemaen',
    new: '2ce42f6a-0f0c-471b-9706-3a9c6007bda0',
  },
  {
    old: 'Efteling_jorisendedraak',
    new: '5db59b64-d2cd-4211-a1fa-b4369b6e110a',
  },
  {
    old: 'Efteling_kinderspoor',
    new: '8e230820-46cc-46f0-bf00-c0487a557fc3',
  },
  {
    old: 'Efteling_kindervreugd',
    new: 'e5a87e0a-bc3c-4cc7-aa03-8349bd395a0c',
  },
  {
    old: 'Efteling_kleuterhof',
    new: '173e38aa-090b-4990-93eb-815c808545cd',
  },
  {
    old: 'Efteling_maxmoritz',
    new: '40a68fb1-428e-4a79-82ac-58e87182a3d1',
  },
  {
    old: 'Efteling_monsieurcannibale',
    new: '0721275b-5b6a-41ee-a50c-6ad422869aef',
  },
  {
    old: 'Efteling_pagode',
    new: '27551b3f-7188-4bd6-b6b9-6bdd6b0f6ddd',
  },
  {
    old: 'Efteling_pirana',
    new: 'a59b1021-ae84-4a11-a93f-545553f5e568',
  },
  {
    old: 'Efteling_python',
    new: 'c0137454-0e1f-451e-85bd-aef4f443c51e',
  },
  {
    old: 'Efteling_speelbosnest',
    new: 'bcd064eb-0541-486d-81b1-0feed5d6371e',
  },
  {
    old: 'Efteling_spookslot',
    new: 'a99c3cdc-e052-4c23-8675-1cc7ee8a4d05',
  },
  {
    old: 'Efteling_sprookjesbos',
    new: '3b01fd39-77d3-437d-a195-9904e010ec3f',
  },
  {
    old: 'Efteling_stoomcarrousel',
    new: '3bfb8272-22e5-40e6-93a0-64f4c9d7fdc6',
  },
  {
    old: 'Efteling_stoomtreinm',
    new: '541e90a0-5b37-46e0-884c-7aa2adf76cb1',
  },
  {
    old: 'Efteling_stoomtreinr',
    new: '00425f47-172b-4666-9012-a3332ba1d53d',
  },
  {
    old: 'Efteling_symbolica',
    new: 'de36a8e7-8c57-459e-8786-4e63e24427d1',
  },
  {
    old: 'Efteling_villavolta',
    new: '454f83b8-b767-44a9-a911-e650901e4520',
  },
  {
    old: 'Efteling_vogelrok',
    new: '1fdcb9bd-7ce3-4b23-a89c-b6d5f338cae9',
  },
  {
    old: 'Efteling_volkvanlaaf',
    new: 'd959f7b8-f77e-4943-96d5-fa1133784bce',
  },
  {
    old: 'Efteling_volkvanlaafmonorail',
    new: '0831420c-7f5f-4256-ae84-d14d086ec702',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_123456',
    new: 'b8ce07f5-1365-4ad1-bd5a-f8ef24cf3f7a',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_P2FD03',
    new: 'da5aa518-95ca-477b-a6e3-31b847fdc8fa',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_P2XA00',
    new: '449a20d8-9bfd-4b2b-b437-38a279aa8d88',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_P2XA02',
    new: 'd944b02c-12ce-4176-ac62-6a936f180b5c',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_P2XA03',
    new: 'f0d4b531-e291-471b-9527-00410c2bbd65',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_P2XA05',
    new: '8e229723-51c1-4668-b956-5bc45305acd9',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_P2XA06',
    new: '15bad9c3-8378-4ac5-ab90-2f8d0ee09d26',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_P2XA07',
    new: 'a10b25e2-3176-449a-a8a5-4119902887bb',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_P2XA08',
    new: '337bce77-57bd-49c7-83d7-662f16c162ea',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_P2XA09',
    new: '73e1c590-ef8f-496c-bf6c-d7e7fde0c7df',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_P2ZA02',
    new: 'd2ec9363-a215-4904-b297-b66734ea9a00',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_animationCelebration',
    new: '20b42588-1a61-4126-a4a4-1d226b6e7970',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_armageddon',
    new: '133dd377-1782-41f0-b269-ac506c80fccc',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_artOfAnimation',
    new: '4952a40b-b3fb-4a7d-a8ac-cb0af0065b94',
  },
  {
    old: 'DisneylandParisWaltDisneyStudios_rockNRollerCoaster',
    new: '10c82e39-6a0a-4508-a097-e3d287b66598',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1AA00',
    new: '63dfcdab-86c2-4185-99b1-5a353d81bb52',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1AA01',
    new: '7e426533-7727-47e5-8c8e-0dcd46198e57',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1AA02',
    new: '5d0ce227-7ad0-4402-a95b-6cf56f25a8ec',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1AA03',
    new: '07782089-5e83-4bee-8a39-735818551844',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1AA04',
    new: '0d822af0-bf02-47a7-bc29-672d2fa4f7ab',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1AA05',
    new: '2aa73e46-8dcf-4201-b334-db31e6e6ca06',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1AA08',
    new: '76e9e917-fe07-49d5-b604-f65d831210fa',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1DA03',
    new: '3a1cd3f7-9c42-4f9b-90fa-dab7ba113862',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1DA04',
    new: '03992704-698d-474b-a721-a5ac3498edb9',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1DA06',
    new: 'd8d9f62a-9fa3-4aae-a568-4225afc35924',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1DA07',
    new: 'f0525c25-4ea2-49b7-aab5-150b27658fb6',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1DA08',
    new: 'ddca340c-7ba1-4f23-89eb-0d3d52c84bda',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1DA09',
    new: '5d10b8b2-7d34-4794-8857-76688e5864bc',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1DA10',
    new: '351af0dc-cd77-45f5-b6c2-a59e871b5a43',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1DA13',
    new: '1bfba2e1-5314-405f-b745-17a7acc7e54e',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1DA14',
    new: 'ced66356-4eca-482d-86ef-958e4a7dc87f',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1MA00',
    new: '7d90d4e6-8c15-44ee-9e94-feb07788f02f',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1MA01',
    new: '0d9296c0-a76c-4578-b0f9-2ff4b4e385b5',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1MA02',
    new: '6bb88973-80d0-45cf-bffe-433f1c551362',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1MA03',
    new: 'a61aeee6-bed5-4890-8209-5249e689b1a1',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1MA04',
    new: 'd6c61231-8f9b-40fa-943a-fe1454e185e7',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1MA05',
    new: 'a5afa85c-ee58-4f47-8626-fa4057e7d266',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1MA06',
    new: 'c2e37859-cd32-4a34-9d6f-43d32d744b4e',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA00',
    new: '252b9b03-f770-4979-b3b2-f4ffecc3894d',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA01',
    new: '8ed1472a-4d2e-47f1-b848-353de0bc3670',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA02',
    new: 'ced30c44-9b79-45de-a8c9-6347298756c1',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA03',
    new: '7ff5d512-aed5-479a-8b3d-9bd1efb4177b',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA04',
    new: 'a620015d-091d-4f82-b8b2-a97bc8641f07',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA05',
    new: '46406e4a-4a02-4d30-89bc-ef1ed63c1ff9',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA06',
    new: '38bafc85-cb48-488e-aa68-3e2d01ae6a10',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA07',
    new: 'ce87a0fe-c644-475e-abb6-9727e05cebff',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA08',
    new: 'bcc5567f-f00b-4a7d-8ee6-526cc8d3d5de',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA09',
    new: '9056906c-0030-4951-be5e-44ac1f273491',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA10',
    new: '7c5b2c2d-1082-4e5c-b155-dc492db16e6e',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA12',
    new: '83fa9e7f-4a25-4bee-8e61-4fb8c59cd350',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA13',
    new: '594dabd8-ddc1-4835-aafa-f654e10ed2db',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA16',
    new: '0216ad22-bada-4303-9635-d7350a942fbc',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1NA17',
    new: '78b5e028-1574-4ea5-9ac1-8d5356400044',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1RA00',
    new: '852d957c-382e-4afb-bb74-70c9a79055df',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1RA03',
    new: '14f756d6-d6fa-4200-8b41-db84ba294fa6',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1RA05',
    new: 'bcbd2214-0f75-4cae-8cff-087adf621330',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1RA06',
    new: '323bec06-fef7-4a60-989d-e3fcf9d3db7e',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1RA07',
    new: '03871aa6-a0b5-41ee-8fd3-b2f4b8dccc79',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1RA10',
    new: '0d9296c0-a76c-4578-b0f9-2ff4b4e385b5',
  },
  {
    old: 'HongKongDisneylandPark_attAnimationAcademy',
    new: '7fe4d143-69ed-4c41-b22b-bb76201896c4',
  },
  {
    old: 'HongKongDisneylandPark_attAntManAndTheWaspNanoBattle',
    new: '7894683a-cedf-457f-a985-7b70aa22cd27',
  },
  {
    old: 'HongKongDisneylandPark_attBigGrizzlyMountainRunawayMineCars',
    new: '34315274-ca4d-4aba-bc8d-a4f1b3de51f0',
  },
  {
    old: 'HongKongDisneylandPark_attBuildingADream',
    new: 'f2c77d95-cffb-4cec-b140-75258389180e',
  },
  {
    old: 'HongKongDisneylandPark_attCinderellaCarousel',
    new: '86f671f7-f03e-4b9f-b097-4b0801acc880',
  },
  {
    old: 'HongKongDisneylandPark_attDumbotheFlyingElephant',
    new: '6f17b733-bd59-4942-ae80-ddb8083ed92d',
  },
  {
    old: 'HongKongDisneylandPark_attFairyTaleForest',
    new: 'f0a5db15-3701-4bf9-a181-961b1ff1b832',
  },
  {
    old: 'HongKongDisneylandPark_attFantasyGardens',
    new: '5af0cb5f-933c-4292-8c0b-497416b6a15a',
  },
  {
    old: 'HongKongDisneylandPark_attHongKongDisneylandRailroadFantasylandStation',
    new: 'c31b3af5-b6e1-4e05-a002-ba250ecfa39b',
  },
  {
    old: 'HongKongDisneylandPark_attHongKongDisneylandRailroadMainStreetStation',
    new: '7e1c918b-9a0c-4160-a49c-bf5a1ab263b1',
  },
  {
    old: 'HongKongDisneylandPark_attHyperspaceMountain',
    new: '207d3ec6-ebe0-4240-8dbc-e87f305654f9',
  },
  {
    old: 'HongKongDisneylandPark_attIronManExperience',
    new: '8483a3f9-89fb-4760-8142-bf62e604cd6f',
  },
  {
    old: 'HongKongDisneylandPark_attIronManTechShowcase',
    new: '0da45ebe-49bf-461d-b915-3b2b27f0bb7e',
  },
  {
    old: 'HongKongDisneylandPark_attJungleRiverCruise',
    new: '8f086466-3a29-48dd-80db-5c0387ee0199',
  },
  {
    old: 'HongKongDisneylandPark_attMadHatterTeaCups',
    new: '0fc85ba4-75c8-445a-8040-17cb52d5c9da',
  },
  {
    old: 'HongKongDisneylandPark_attMainStreetVehicles',
    new: 'f11f10e6-051a-4df7-b51d-2aba941bab54',
  },
  {
    old: 'HongKongDisneylandPark_attMickeysPhilharMagic',
    new: '0fc7ef9c-6230-47de-a12c-3c463a76f6ae',
  },
  {
    old: 'HongKongDisneylandPark_attMysticManor',
    new: 'f4e15f21-c32a-45bf-a536-5b6cd2480e5e',
  },
  {
    old: 'HongKongDisneylandPark_attOrbitron',
    new: '39aa849c-7125-4d94-b52c-796902c88ab1',
  },
  {
    old: 'HongKongDisneylandPark_attRCRacer',
    new: 'a531cfa9-411e-485f-9c0c-9b1920f89f72',
  },
  {
    old: 'HongKongDisneylandPark_attRafttoTarzansTreehouse',
    new: '5e0be75e-0c91-4115-9efa-db4ed9d6bd40',
  },
  {
    old: 'HongKongDisneylandPark_attSlinkyDogSpin',
    new: '46b472b3-f852-402a-ba6c-744097db7b9c',
  },
  {
    old: 'HongKongDisneylandPark_attStarWarsCommandPost',
    new: '46ec2caa-c514-45c0-a2aa-a403bf9afd12',
  },
  {
    old: 'HongKongDisneylandPark_attTarzansTreehouse',
    new: '0eec6d76-28d8-43db-86b5-dabb511fc927',
  },
  {
    old: 'HongKongDisneylandPark_attTheManyAdventuresofWinniethePooh',
    new: '24c640cc-74f3-445d-88bd-f24e66121ec3',
  },
  {
    old: 'HongKongDisneylandPark_attTheRoyalReceptionHall',
    new: '55de9d19-97e7-45da-8200-5545670a207f',
  },
  {
    old: 'HongKongDisneylandPark_attToySoldierParachuteDrop',
    new: '08ce8f03-1391-43ba-9326-970134159fc7',
  },
  {
    old: 'HongKongDisneylandPark_attitsasmallworld',
    new: '48395fff-2902-4aab-a7b9-480bfdd5ab72',
  },
  {
    old: 'HongKongDisneylandPark_dinePlazaInn',
    new: '9c1961f2-f009-4c1a-9046-8507839fb4f4',
  },
  {
    old: 'HongKongDisneylandPark_dineRiverViewCafe',
    new: '6a82a386-9229-4d30-b621-dec8393de5a6',
  },
  {
    old: 'ShanghaiDisneylandPark_attAdventuresWinniePooh',
    new: '8dede135-9a2e-4fb1-9470-4e493c96db9c',
  },
  {
    old: 'ShanghaiDisneylandPark_attAliceWonderlandMaze',
    new: 'ecd7c9fe-bcf1-4401-8c1a-287eb5ac3f4c',
  },
  {
    old: 'ShanghaiDisneylandPark_attBecomeIronMan',
    new: '472eb06a-c684-4939-acf1-99575f959334',
  },
  {
    old: 'ShanghaiDisneylandPark_attBuzzAttraction',
    new: '8a7b5eb4-9e3e-463b-af65-395b392ebc6f',
  },
  {
    old: 'ShanghaiDisneylandPark_attBuzzLightyearPlanetRescue',
    new: '8a7b5eb4-9e3e-463b-af65-395b392ebc6f',
  },
  {
    old: 'ShanghaiDisneylandPark_attCampDiscovery',
    new: '35ab7e5a-733f-41b1-9fb9-82c208edb877',
  },
  {
    old: 'ShanghaiDisneylandPark_attCaptainAmerica',
    new: 'e3b7a1d5-9f84-49c9-9887-0602ea8c6eed',
  },
  {
    old: 'ShanghaiDisneylandPark_attChallengeTrails',
    new: '35ab7e5a-733f-41b1-9fb9-82c208edb877',
  },
  {
    old: 'ShanghaiDisneylandPark_attDisneyPrincessesStorybookCourt',
    new: 'bc874cc6-be23-4cc2-9178-9b0283fa4dae',
  },
  {
    old: 'ShanghaiDisneylandPark_attDumboFlyingElephant',
    new: '57505d8a-1b5d-490e-82bd-1edf38505bfe',
  },
  {
    old: 'ShanghaiDisneylandPark_attExplorerCanoes',
    new: 'eef91f74-0d4e-4f58-bdc9-3236306f6707',
  },
  {
    old: 'ShanghaiDisneylandPark_attFantasiaCarousel',
    new: 'a5d3aff4-6f33-4347-bb95-cd58c34eacc1',
  },
  {
    old: 'ShanghaiDisneylandPark_attHunnyPotSpin',
    new: 'a1263174-68f3-4207-9c89-cb53860e1e0a',
  },
  {
    old: 'ShanghaiDisneylandPark_attJetPacks',
    new: '1eb2a711-ab84-4bbf-b351-ce2668861cd5',
  },
  {
    old: 'ShanghaiDisneylandPark_attJungleFriendsHappyCircle',
    new: 'd20c4217-cd40-41ad-8341-bbe35e6b09fb',
  },
  {
    old: 'ShanghaiDisneylandPark_attMarvelSuperHeroes',
    new: 'f2212284-daf2-4f1d-be0a-389c519b24c3',
  },
  {
    old: 'ShanghaiDisneylandPark_attMarvelUniverse',
    new: 'f2212284-daf2-4f1d-be0a-389c519b24c3',
  },
  {
    old: 'ShanghaiDisneylandPark_attMeetMickeyGardensImagination',
    new: '68b216a6-6e6d-44d9-a700-d759d3e9c72e',
  },
  {
    old: 'ShanghaiDisneylandPark_attMineTrain',
    new: 'd0e8c1f9-1fab-4081-bb7d-920815f28aa3',
  },
  {
    old: 'ShanghaiDisneylandPark_attOnceUponTimeAdventure',
    new: 'ac0f3ca2-baa5-40b7-a579-f3c822b5b396',
  },
  {
    old: 'ShanghaiDisneylandPark_attPeterPanFlight',
    new: '75aaf016-29ce-4a74-b5c2-d25876d34a6a',
  },
  {
    old: 'ShanghaiDisneylandPark_attPeterPansFlight',
    new: '75aaf016-29ce-4a74-b5c2-d25876d34a6a',
  },
  {
    old: 'ShanghaiDisneylandPark_attPiratesOfCaribbean',
    new: '87e0fa71-e0e2-4af9-a175-3569b7880680',
  },
  {
    old: 'ShanghaiDisneylandPark_attRapids',
    new: 'af87332e-f54c-401a-abbd-d1560e173018',
  },
  {
    old: 'ShanghaiDisneylandPark_attRexsRCRacer',
    new: '00e7ba97-02f1-408e-8cdc-48836b260b92',
  },
  {
    old: 'ShanghaiDisneylandPark_attRoaringRapids',
    new: 'af87332e-f54c-401a-abbd-d1560e173018',
  },
  {
    old: 'ShanghaiDisneylandPark_attSevenDwarfsMineTrain',
    new: 'd0e8c1f9-1fab-4081-bb7d-920815f28aa3',
  },
  {
    old: 'ShanghaiDisneylandPark_attShipwreckShore',
    new: '7a5c957e-9176-4395-8b8e-a1e0999511f2',
  },
  {
    old: 'ShanghaiDisneylandPark_attSirensRevenge',
    new: '8f6a092a-4c9c-4ee3-9b0e-51788d2f2cc0',
  },
  {
    old: 'ShanghaiDisneylandPark_attSlinkyDogSpin',
    new: '6d4f514e-1557-4d7b-942a-83454650365c',
  },
  {
    old: 'ShanghaiDisneylandPark_attSoaringAttraction',
    new: '4c72fb0a-b1b1-409b-8d7b-7182e95ac237',
  },
  {
    old: 'ShanghaiDisneylandPark_attSoaringOverHorizon',
    new: '4c72fb0a-b1b1-409b-8d7b-7182e95ac237',
  },
  {
    old: 'ShanghaiDisneylandPark_attSpiderMan',
    new: 'cc7c24a0-401b-405e-afa5-1436cf80a6df',
  },
  {
    old: 'ShanghaiDisneylandPark_attStitchEncounter',
    new: '49d7604a-61b7-4b99-835e-3349673ef745',
  },
  {
    old: 'ShanghaiDisneylandPark_attTheManyAdventuresOfWinnieThePooh',
    new: '8dede135-9a2e-4fb1-9470-4e493c96db9c',
  },
  {
    old: 'ShanghaiDisneylandPark_attTrailsAttraction',
    new: '35ab7e5a-733f-41b1-9fb9-82c208edb877',
  },
  {
    old: 'ShanghaiDisneylandPark_attTronAttraction',
    new: '72d2c957-0280-4bfa-b2fc-5c70913a613b',
  },
  {
    old: 'ShanghaiDisneylandPark_attTronLightcyclePowerRun',
    new: '72d2c957-0280-4bfa-b2fc-5c70913a613b',
  },
  {
    old: 'ShanghaiDisneylandPark_attTronRealm',
    new: 'e58a7bc9-8900-48f7-a370-f848fda12eec',
  },
  {
    old: 'ShanghaiDisneylandPark_attVistaTrail',
    new: '35ab7e5a-733f-41b1-9fb9-82c208edb877',
  },
  {
    old: 'ShanghaiDisneylandPark_attVoyageToCrystalGrotto',
    new: '73d08894-9a00-49ee-bd4a-9fb0979d9a65',
  },
  {
    old: 'ShanghaiDisneylandPark_attWoodysRoundUp',
    new: '709e7684-57b3-4502-a358-f59673239854',
  },
  {
    old: 'TokyoDisneyland_151',
    new: 'cf1e721e-ba51-4e48-a2bc-b07883091e88',
  },
  {
    old: 'TokyoDisneyland_152',
    new: '52eb0fc9-5853-49c8-8c72-1e5e83aae1c1',
  },
  {
    old: 'TokyoDisneyland_153',
    new: 'e0887415-3da2-458c-8b88-0691e6b8ab63',
  },
  {
    old: 'TokyoDisneyland_154',
    new: '6ee0697f-57ba-4c7b-8216-7c55b21288d4',
  },
  {
    old: 'TokyoDisneyland_155',
    new: 'f9321bc7-aa96-4a70-b963-681482384d1b',
  },
  {
    old: 'TokyoDisneyland_156',
    new: '4f0b3416-0b0a-419b-ba8c-6ee00b7d7144',
  },
  {
    old: 'TokyoDisneyland_157',
    new: '4876ec54-92ed-4b0c-8b1b-292bba89c61c',
  },
  {
    old: 'TokyoDisneyland_158',
    new: '83f11a48-0d22-4429-8e59-43fd611d6795',
  },
  {
    old: 'TokyoDisneyland_159',
    new: '02a96ff7-da13-48b5-b1a8-f29d9f6109fc',
  },
  {
    old: 'TokyoDisneyland_160',
    new: 'e3577b4a-f1d9-4ec5-aacf-b99977ea88c9',
  },
  {
    old: 'TokyoDisneyland_161',
    new: '077c390c-c214-40c4-83e9-93d8f8621141',
  },
  {
    old: 'TokyoDisneyland_162',
    new: 'dfe25d8e-e234-4020-a261-30c6825d0680',
  },
  {
    old: 'TokyoDisneyland_163',
    new: '037a13bf-b06e-4902-aa12-02d758d1718d',
  },
  {
    old: 'TokyoDisneyland_164',
    new: 'e541ad8f-1457-469a-8f35-457555f475ad',
  },
  {
    old: 'TokyoDisneyland_165',
    new: 'a853aadd-2337-435a-b0a3-2c03db96e5e1',
  },
  {
    old: 'TokyoDisneyland_166',
    new: 'f82709b6-51a3-4b65-8d6f-c2472f5053df',
  },
  {
    old: 'TokyoDisneyland_167',
    new: '392ca2e8-afe0-4103-b296-c45bd373d036',
  },
  {
    old: 'TokyoDisneyland_168',
    new: '6922377e-0ff4-481f-9da3-35051938732a',
  },
  {
    old: 'TokyoDisneyland_169',
    new: '78510449-ec64-47d3-a140-7b473dbaddf2',
  },
  {
    old: 'TokyoDisneyland_170',
    new: '1fb05b7d-953a-4fa7-b7ed-db2eb62b85bf',
  },
  {
    old: 'TokyoDisneyland_171',
    new: '8fce6b54-e3e4-40bb-a574-93c8327c3fab',
  },
  {
    old: 'TokyoDisneyland_172',
    new: '0de1b543-46fd-4c3f-81c8-31d0cab9ef63',
  },
  {
    old: 'TokyoDisneyland_173',
    new: 'cfaa7d1c-111e-49b9-b21b-134eac4000e8',
  },
  {
    old: 'TokyoDisneyland_174',
    new: 'a88464b5-2cf5-4ef1-b38f-96e07b233bf2',
  },
  {
    old: 'TokyoDisneyland_175',
    new: '73384e33-a86a-4601-996f-61dbffba6ec2',
  },
  {
    old: 'TokyoDisneyland_176',
    new: '534ca90a-2626-4a45-9b7b-1964ed15678e',
  },
  {
    old: 'TokyoDisneyland_178',
    new: 'a0a63e1c-3fc6-4433-b9b1-f5e798ab1f00',
  },
  {
    old: 'TokyoDisneyland_179',
    new: '52c5e406-67e2-4d37-aee8-987644d87b63',
  },
  {
    old: 'TokyoDisneyland_180',
    new: '2d215a6d-77a2-4c44-a2e3-c293c1289876',
  },
  {
    old: 'TokyoDisneyland_181',
    new: '74f17654-ceb1-4f12-9c19-ce6ed0587f33',
  },
  {
    old: 'TokyoDisneyland_183',
    new: '512fd34c-2f0a-4e0a-bcc1-ef4d15c5f803',
  },
  {
    old: 'TokyoDisneyland_184',
    new: '8567076f-c996-45ac-84d2-2e68e514806d',
  },
  {
    old: 'TokyoDisneyland_185',
    new: '3cdacebb-39c9-4b71-8223-c814b3775c18',
  },
  {
    old: 'TokyoDisneyland_189',
    new: '4ed6a812-df04-4aa8-acb9-c6b164dbb706',
  },
  {
    old: 'TokyoDisneyland_191',
    new: '55458c39-ee47-4b8d-ab07-991d12a0313d',
  },
  {
    old: 'TokyoDisneyland_194',
    new: '5f0425c4-7d35-4afd-bb28-6c73f1920b1f',
  },
  {
    old: 'TokyoDisneyland_195',
    new: '05c7400b-866d-4d47-9cb1-8722fe6b22da',
  },
  {
    old: 'TokyoDisneyland_196',
    new: 'ca00a0e8-f069-4d0a-9d5e-10cb63010956',
  },
  {
    old: 'TokyoDisneyland_197',
    new: 'e76670f0-9f5f-4918-8491-9bf51e73a596',
  },
  {
    old: 'TokyoDisneySea_202',
    new: 'a674e149-8ae3-4338-b1e3-c9f6b804f475',
  },
  {
    old: 'TokyoDisneySea_218',
    new: 'abb5d6ec-469e-4ab0-8685-5f04e9749653',
  },
  {
    old: 'TokyoDisneySea_219',
    new: '3407ebac-c575-4c31-b794-1d271014d303',
  },
  {
    old: 'TokyoDisneySea_220',
    new: 'abbf5b3e-94e5-420a-8257-34594cd9d590',
  },
  {
    old: 'TokyoDisneySea_221',
    new: '70c16669-c9ba-4f83-bd25-3cd9ea5a0b0c',
  },
  {
    old: 'TokyoDisneySea_222',
    new: 'f66e072d-8bab-48e5-b8cf-6d1947bd291b',
  },
  {
    old: 'TokyoDisneySea_223',
    new: 'c8526be3-e82c-4692-ae44-e8f2d1142c8a',
  },
  {
    old: 'TokyoDisneySea_224',
    new: 'c15da0f5-9668-48ee-b93a-8b737b6acf5b',
  },
  {
    old: 'TokyoDisneySea_226',
    new: 'dcad67fe-76bb-4df2-bf5b-aaf70e8efc12',
  },
  {
    old: 'TokyoDisneySea_227',
    new: '7afc3143-befb-4a61-9c86-8d6869eb2ce3',
  },
  {
    old: 'TokyoDisneySea_228',
    new: '8dbc5d52-ef41-406d-aaad-eb2e6bb3eaea',
  },
  {
    old: 'TokyoDisneySea_229',
    new: 'de24aae5-66b9-469f-91f6-ef6c3f3b665c',
  },
  {
    old: 'TokyoDisneySea_230',
    new: '2ca8f848-b8e2-4ba5-aa6e-e0fb37e85d0b',
  },
  {
    old: 'TokyoDisneySea_231',
    new: 'c8744918-42c0-427d-8947-c3dbd1abf8d5',
  },
  {
    old: 'TokyoDisneySea_232',
    new: '2daf12ac-21fd-4bfd-bbf6-0c98bed03e8f',
  },
  {
    old: 'TokyoDisneySea_233',
    new: '5449e9da-ee4c-47d8-a60a-8a964b94c32d',
  },
  {
    old: 'TokyoDisneySea_234',
    new: '2159960b-4f42-4974-93be-7519816de45d',
  },
  {
    old: 'TokyoDisneySea_235',
    new: '63ef07eb-9bfb-4782-885e-cfd08ced82f0',
  },
  {
    old: 'TokyoDisneySea_236',
    new: '76aed95a-dce8-4d03-8c2a-8ad69b3d0d4a',
  },
  {
    old: 'TokyoDisneySea_237',
    new: '2d56558a-d4d2-4f79-898c-178c2c20cf67',
  },
  {
    old: 'TokyoDisneySea_238',
    new: '58815e8e-7c01-4a42-8a00-1bd1c82a0252',
  },
  {
    old: 'TokyoDisneySea_239',
    new: 'c6c0d34d-531a-40d9-b711-3497fd53c28b',
  },
  {
    old: 'TokyoDisneySea_240',
    new: 'f37d7fe8-169f-459d-86f3-4843655358bd',
  },
  {
    old: 'TokyoDisneySea_241',
    new: '7594d3f2-b3d1-47a0-b64f-8bc01d373830',
  },
  {
    old: 'TokyoDisneySea_242',
    new: 'dd942cd2-b364-4262-af12-ca1a5012528b',
  },
  {
    old: 'TokyoDisneySea_243',
    new: '4ca7254c-7abc-4e52-82e0-9c562c096494',
  },
  {
    old: 'TokyoDisneySea_244',
    new: '6e44f5c0-f996-45ad-aa7e-9738df6a6047',
  },
  {
    old: 'TokyoDisneySea_245',
    new: '44df35ec-28cb-4465-9ae1-95a4d6445a82',
  },
  {
    old: 'TokyoDisneySea_246',
    new: '71943126-e4ac-49c5-ac61-ac1687ad33af',
  },
  {
    old: 'TokyoDisneySea_247',
    new: '179e4e82-26ed-4b04-bf21-f03808b61df4',
  },
  {
    old: 'UniversalStudios_18073',
    new: 'bcfb0a12-005d-4fa7-9710-ea413fa65400',
  },
  {
    old: 'UniversalStudios_18138',
    new: '225f5fbf-3e7e-4fca-a94a-4a3a747c5103',
  },
  {
    old: 'UniversalStudios_18139',
    new: '513ae5d3-477d-4d95-82a1-f4ac99678a8d',
  },
  {
    old: 'UniversalStudios_18140',
    new: '2f6f1b8f-d420-4096-8975-fcccfd7fc74c',
  },
  {
    old: 'UniversalStudios_18141',
    new: 'cc17465b-4ee2-49ef-b0bc-3065ecae28f7',
  },
  {
    old: 'UniversalStudios_18142',
    new: '73cc9242-3eea-4a34-8553-9aded86329dc',
  },
  {
    old: 'UniversalStudios_18143',
    new: '6a04b16b-7d9f-4a92-bcef-b8e17b800a34',
  },
  {
    old: 'UniversalStudios_18144',
    new: '8215f2cf-6356-421d-80fa-0e9b26f57bcd',
  },
  {
    old: 'UniversalStudios_18145',
    new: 'bc53c39c-7d8b-4f28-958d-f3a077d887cd',
  },
  {
    old: 'UniversalStudios_18146',
    new: '9a706e7e-1e52-4603-b170-86c9b8243fc6',
  },
  {
    old: 'UniversalStudios_18147',
    new: '7254c0aa-f0ec-4964-8a44-5c959f786616',
  },
  {
    old: 'UniversalStudios_18148',
    new: 'e7c69919-d73f-4418-9059-5b30495f3af1',
  },
  {
    old: 'UniversalStudios_18149',
    new: '9e507da6-9427-4d7f-b315-250a2b2dde97',
  },
  {
    old: 'UniversalIslandsOfAdventure_10831',
    new: '6be23178-7d00-4884-9e88-76787da1df86',
  },
  {
    old: 'UniversalIslandsOfAdventure_10832',
    new: '3cb52134-e9d6-4212-83c8-3ce1321dcb05',
  },
  {
    old: 'UniversalIslandsOfAdventure_10833',
    new: '2365495a-790b-4a41-831e-65592c8a4359',
  },
  {
    old: 'UniversalIslandsOfAdventure_10835',
    new: '2f95b213-daaa-4370-8349-c2cd57be470e',
  },
  {
    old: 'UniversalIslandsOfAdventure_10837',
    new: '905d7888-b866-4e74-90d1-07fc6ef6706f',
  },
  {
    old: 'UniversalIslandsOfAdventure_10839',
    new: '23b613e0-ae83-455b-9163-231bdbd5c427',
  },
  {
    old: 'UniversalIslandsOfAdventure_10840',
    new: '6af80308-647d-4d8b-bcf6-37517a93bdbc',
  },
  {
    old: 'UniversalIslandsOfAdventure_10842',
    new: 'db5b2165-15c2-4e51-8bd1-611e9c351866',
  },
  {
    old: 'UniversalIslandsOfAdventure_10855',
    new: 'b1e94e05-b360-4e3f-be8a-2a3744a97f97',
  },
  {
    old: 'UniversalIslandsOfAdventure_10856',
    new: 'b4445a1c-4d5c-4fca-a04a-f8867f1b6619',
  },
  {
    old: 'UniversalIslandsOfAdventure_10857',
    new: '3daca54f-50f0-44e9-a993-d706ce7520a0',
  },
  {
    old: 'UniversalIslandsOfAdventure_10859',
    new: 'b73e3256-9ee0-439e-9a3b-ffed287e10bb',
  },
  {
    old: 'UniversalIslandsOfAdventure_10862',
    new: 'fa743143-281b-4b5b-b87b-d49fcb006772',
  },
  {
    old: 'UniversalIslandsOfAdventure_13225',
    new: '144450b9-4574-46be-abdf-4b1ca8974d9d',
  },
  {
    old: 'UniversalIslandsOfAdventure_13799',
    new: '370ba4d1-f199-4dc2-be6d-6bb09b442891',
  },
  {
    old: 'UniversalIslandsOfAdventure_17097',
    new: '578bbd12-1975-4ec3-9879-ea641c780342',
  },
  {
    old: 'UniversalIslandsOfAdventure_18154',
    new: '61079a31-4165-4fb0-b36f-c01c5971f80a',
  },
  {
    old: 'UniversalIslandsOfAdventure_18162',
    new: 'f6dba1c6-6f5a-4743-8470-f741ecac555d',
  },
  {
    old: 'UniversalIslandsOfAdventure_18163',
    new: '391dea99-303d-42a1-aa86-a846d1c1fa1f',
  },
  {
    old: 'EuropaPark_100',
    new: '4e20b7ad-c0b5-44d1-bc21-0355aaac704c',
  },
  {
    old: 'EuropaPark_101',
    new: '471dbf1b-52ae-454a-9ade-7c048098f230',
  },
  {
    old: 'EuropaPark_102',
    new: '3bddf6d7-4713-4f39-85cf-e29653fd672e',
  },
  {
    old: 'EuropaPark_150',
    new: '28c8c7f4-00a5-40fc-aca5-1c1d56253275',
  },
  {
    old: 'EuropaPark_151',
    new: '2a03f3f7-41c9-4248-90e0-8d5abe605fcb',
  },
  {
    old: 'EuropaPark_152',
    new: '960eb648-97c3-46b5-b912-568287d2a894',
  },
  {
    old: 'EuropaPark_153',
    new: 'f2d9c111-a979-48ec-9832-b89b09ab30c9',
  },
  {
    old: 'EuropaPark_155',
    new: '8943b5fc-df9d-48c2-8440-a984757ac769',
  },
  {
    old: 'EuropaPark_156',
    new: '794981e8-df86-4222-8719-cc68031d8ca4',
  },
  {
    old: 'EuropaPark_157',
    new: '3db36bb6-9e01-44b9-a45c-0d1f6b3fe7ba',
  },
  {
    old: 'EuropaPark_158',
    new: '62a4880f-ac2c-4368-8d0f-4ad3b05678cb',
  },
  {
    old: 'EuropaPark_159',
    new: '62a5b589-9d17-4842-a744-a607e89415d8',
  },
  {
    old: 'EuropaPark_160',
    new: '1a791670-eb78-4460-b8a7-9325fc06b2be',
  },
  {
    old: 'EuropaPark_163',
    new: '12011170-bf1e-4eeb-bcac-5cb594fb3565',
  },
  {
    old: 'EuropaPark_2',
    new: 'd5222fe4-cfe6-4488-afcc-7cb46a7873ee',
  },
  {
    old: 'EuropaPark_200',
    new: 'b8767bbd-a974-4fab-b817-7629d9984027',
  },
  {
    old: 'EuropaPark_201',
    new: '4f6113fb-b974-4ab2-96f1-1c277b122cf9',
  },
  {
    old: 'EuropaPark_202',
    new: '0cc3250f-c87b-4d40-91e2-4ac14ddfc7ff',
  },
  {
    old: 'EuropaPark_203',
    new: 'b4bbfb91-3b1c-4347-89ae-4a8848079b40',
  },
  {
    old: 'EuropaPark_204',
    new: '12dc8d87-8f46-4371-8b6f-466a0caa660e',
  },
  {
    old: 'EuropaPark_207',
    new: 'ab14a92b-f0de-4b91-a944-8425188d4bec',
  },
  {
    old: 'EuropaPark_250',
    new: '55c5ba56-9b0d-4269-b375-24ae94538947',
  },
  {
    old: 'EuropaPark_3',
    new: '0f0e1402-8a4b-4245-bcb5-1ec2fa45ce34',
  },
  {
    old: 'EuropaPark_350',
    new: '130893bb-5f5e-4aa1-b3bd-852a557967ae',
  },
  {
    old: 'EuropaPark_351',
    new: '64ee19d9-f5bd-4c46-9f32-b60507c699be',
  },
  {
    old: 'EuropaPark_352',
    new: '05183562-a40b-427b-87cc-af26228a6779',
  },
  {
    old: 'EuropaPark_4',
    new: 'ae2fa494-da46-425d-aad4-4395a61d12b3',
  },
  {
    old: 'EuropaPark_400',
    new: '35fd49dd-ef8b-4e1e-ac1f-28f4e49c6691',
  },
  {
    old: 'EuropaPark_401',
    new: '0ecb06c5-a6ca-473a-b1c3-a16969301f28',
  },
  {
    old: 'EuropaPark_402',
    new: '74f7a8c4-f0f0-43e8-8b83-1da96769bee8',
  },
  {
    old: 'EuropaPark_403',
    new: '4905c6c8-9882-4e43-a05f-d03254dbb5e5',
  },
  {
    old: 'EuropaPark_404',
    new: '42f8202f-54cf-4f82-9fd6-6608b6df66b9',
  },
  {
    old: 'EuropaPark_405',
    new: '80632802-fafc-453b-9490-429f3cd46ec7',
  },
  {
    old: 'EuropaPark_450',
    new: 'a4c5c34a-5637-4a6c-bf86-29b6529fb826',
  },
  {
    old: 'EuropaPark_451',
    new: 'def1125e-8b9b-4cc1-ae72-b1c27797d6e5',
  },
  {
    old: 'EuropaPark_452',
    new: 'be826902-b955-4053-9d89-85a116aff70b',
  },
  {
    old: 'EuropaPark_453',
    new: 'f534a338-ab42-484e-aefc-76382706b3b6',
  },
  {
    old: 'EuropaPark_454',
    new: 'c6f56be1-6d73-48a4-9524-586c86f18d06',
  },
  {
    old: 'EuropaPark_456',
    new: '96cd2119-d354-4ed1-ac30-89b7635b7cdd',
  },
  {
    old: 'EuropaPark_457',
    new: 'a96088ff-98df-4704-9564-19ad5e338119',
  },
  {
    old: 'EuropaPark_495',
    new: '99423d71-89fd-46bb-a988-9fe636a7bcd6',
  },
  {
    old: 'EuropaPark_5',
    new: '9a36b8ee-5efe-456b-a359-26b6c14421ff',
  },
  {
    old: 'EuropaPark_500',
    new: 'd1bd3846-b26a-4308-aca8-634a248115ba',
  },
  {
    old: 'EuropaPark_501',
    new: '483763c0-446d-4345-a397-e47dac1943ec',
  },
  {
    old: 'EuropaPark_503',
    new: '546e874f-12ac-441d-ad4e-4a8af1e8320d',
  },
  {
    old: 'EuropaPark_504',
    new: '7f2e2d65-1c89-4443-ab2b-3ecf432d2b1f',
  },
  {
    old: 'EuropaPark_550',
    new: 'b8dbd2ab-adc1-49be-88d8-408dffe7982f',
  },
  {
    old: 'EuropaPark_551',
    new: '98936f56-9c3a-41f6-b525-aeaf9dd621ae',
  },
  {
    old: 'EuropaPark_552',
    new: '5b080d88-fcc6-4d30-9778-a3ffbc387d87',
  },
  {
    old: 'EuropaPark_553',
    new: 'befc3cfa-109a-453a-b21a-8708e09db7c5',
  },
  {
    old: 'EuropaPark_554',
    new: 'beb522d4-7e61-4ccc-a418-47015f18ff3e',
  },
  {
    old: 'EuropaPark_560',
    new: '38874248-6c53-418d-993c-329e0272265e',
  },
  {
    old: 'EuropaPark_562',
    new: '9febded1-e141-4c58-8fae-6bdfb49d1bd2',
  },
  {
    old: 'EuropaPark_600',
    new: 'b80e783d-2dfd-43e3-941e-03f24b471352',
  },
  {
    old: 'EuropaPark_601',
    new: 'bb3017ed-4486-4129-be7c-a8e7ecdee0f7',
  },
  {
    old: 'EuropaPark_602',
    new: '508a3133-a8e9-4562-8fff-c61dffcbf435',
  },
  {
    old: 'EuropaPark_612',
    new: '056c3132-6eba-4f2e-85d3-a90b028dff72',
  },
  {
    old: 'EuropaPark_650',
    new: '9e54d71b-5053-44c7-b006-86f3b819a92b',
  },
  {
    old: 'EuropaPark_651',
    new: 'b9324175-f513-42ee-834a-7f0fe172eda2',
  },
  {
    old: 'EuropaPark_665',
    new: 'e9c7ba75-651e-45c7-aa48-2bee6abc3d9d',
  },
  {
    old: 'EuropaPark_700',
    new: '8835c9be-435b-4fc6-b365-8d1a24813837',
  },
  {
    old: 'EuropaPark_701',
    new: '6aa5bc27-411d-4ea9-b50a-7db5f37cfbb6',
  },
  {
    old: 'EuropaPark_702',
    new: '6c885bfe-fee5-4b8c-a806-cbde2afa738e',
  },
  {
    old: 'EuropaPark_703',
    new: 'f44a3178-f572-4eac-86c4-e788abdad8b2',
  },
  {
    old: 'EuropaPark_706',
    new: 'f44a3178-f572-4eac-86c4-e788abdad8b2',
  },
  {
    old: 'EuropaPark_711',
    new: '3b8de57d-5a3b-4923-a9f1-9fd600c0ce91',
  },
  {
    old: 'EuropaPark_750',
    new: 'b5b0bfda-2527-447f-adaf-cb6e331bde05',
  },
  {
    old: 'EuropaPark_751',
    new: 'd7ff2f49-d9c4-42a7-b180-fab32ab44ad5',
  },
  {
    old: 'EuropaPark_752',
    new: '218b3ece-58b6-4f36-aa3b-ff16694f550f',
  },
  {
    old: 'EuropaPark_753',
    new: '28689826-889d-4079-b7f2-5a7a54bcb50b',
  },
  {
    old: 'EuropaPark_761',
    new: 'b53dad0b-b404-4fbc-bd43-157adf10ed9f',
  },
  {
    old: 'EuropaPark_800',
    new: 'ec8275e1-b261-4996-bbf8-2e8c42ac2365',
  },
  {
    old: 'EuropaPark_801',
    new: '244c2c77-5e74-4647-9a32-d36c2b072edc',
  },
  {
    old: 'EuropaPark_815',
    new: 'eb711d00-6818-4663-a6b2-dfff74fc08df',
  },
  {
    old: 'EuropaPark_850',
    new: '3ae17a5c-c7e0-428d-a93c-e59604365021',
  },
  {
    old: 'EuropaPark_851',
    new: '8387a570-e898-4a94-baf6-d4cadebc7cae',
  },
  {
    old: 'EuropaPark_852',
    new: 'ae0551d7-532a-4ab1-abdf-b21ef155c32a',
  },
  {
    old: 'EuropaPark_853',
    new: '686c3cc3-3b30-4033-b245-e0856737bb26',
  },
  {
    old: 'EuropaPark_854',
    new: '7e927c0f-61f1-4f81-9346-8572ef43f980',
  },
  {
    old: 'EuropaPark_862',
    new: 'db5a494b-aa6c-4ca3-88e2-7052643e7fb0',
  },
  {
    old: 'EuropaPark_9',
    new: '15768ab3-0781-4ad6-bf76-4d0cef45f491',
  },
  {
    old: 'EuropaPark_900',
    new: '34020ff4-1114-44f0-94e7-fb579cb89d46',
  },
  {
    old: 'EuropaPark_901',
    new: '812a98b5-20b0-4c01-8301-acde44d42b7d',
  },
  {
    old: 'EuropaPark_902',
    new: '73dc972b-0858-427e-854c-3cc5e1677fca',
  },
  {
    old: 'EuropaPark_905',
    new: '7a9f1186-7983-4cbe-9b57-2c420f07172d',
  },
  {
    old: 'EuropaPark_986',
    new: '5f35ce95-cfb7-4366-a18b-bd12deb3a216',
  },
  {
    old: 'UniversalStudiosFlorida_10135',
    new: '7288f24a-396e-4eeb-bb3b-4a90e65269f2',
  },
  {
    old: 'UniversalStudiosFlorida_10838',
    new: '1e16afdd-15e3-4e4a-b3af-8aeebd7534f8',
  },
  {
    old: 'UniversalStudiosFlorida_10841',
    new: '2c72d1d0-7106-439d-9672-5bf95795ccea',
  },
  {
    old: 'UniversalStudiosFlorida_10853',
    new: '91cae293-64f8-48b6-88ec-02dcfcdd1f91',
  },
  {
    old: 'UniversalStudiosFlorida_10858',
    new: 'ec25d9a7-b4d4-4ebf-a6c4-c18389351764',
  },
  {
    old: 'UniversalStudiosFlorida_10860',
    new: '1bddc205-ad5e-45f3-a24c-30803ce3bdb2',
  },
  {
    old: 'UniversalStudiosFlorida_10875',
    new: '7e70bc9e-7dce-4dd2-8823-57b8d6ec7570',
  },
  {
    old: 'UniversalStudiosFlorida_10877',
    new: '750939c5-a69e-408a-8d55-66c272fa265e',
  },
  {
    old: 'UniversalStudiosFlorida_10879',
    new: 'ddc9db13-1884-420b-b4cc-f28d9e1760d1',
  },
  {
    old: 'UniversalStudiosFlorida_13221',
    new: '70ac72a3-9675-4c41-a1b1-e4801072927a',
  },
  {
    old: 'UniversalStudiosFlorida_13228',
    new: 'f0750e5e-7629-4c53-99d2-e0924a8afeed',
  },
  {
    old: 'UniversalStudiosFlorida_14348',
    new: '625a3cc3-7d7e-468b-96fe-1ec00df7b739',
  },
  {
    old: 'UniversalStudiosFlorida_17872',
    new: '96e71193-49f0-40b2-9bba-644e530d8115',
  },
  {
    old: 'UniversalStudiosFlorida_17924',
    new: '6a3ffac7-bef4-4a22-8ba6-f2963aac7f70',
  },
  {
    old: 'UniversalStudiosFlorida_18185',
    new: 'eaec03a6-67a8-4ff0-b31b-234b87187044',
  },
  {
    old: 'UniversalVolcanoBay_14593',
    new: '89f2586a-328a-413e-802f-307260d9ce37',
  },
  {
    old: 'UniversalVolcanoBay_14594',
    new: '74fde289-fcc3-47dc-ad9b-395efb04e89e',
  },
  {
    old: 'UniversalVolcanoBay_14595',
    new: '4eb17ae5-c47c-4ad2-97f3-189e56fa6d52',
  },
  {
    old: 'UniversalVolcanoBay_14596',
    new: 'b2a614e0-a40c-4f46-85f9-c0556086f6a8',
  },
  {
    old: 'UniversalVolcanoBay_14597',
    new: '9855e94c-7ccb-40a6-a1de-5de82699e1dd',
  },
  {
    old: 'UniversalVolcanoBay_14598',
    new: 'c1cdeb80-67e3-4b75-b057-440004c8f499',
  },
  {
    old: 'UniversalVolcanoBay_14599',
    new: '3c1498f0-69d2-4f19-b585-ea050f85c844',
  },
  {
    old: 'UniversalVolcanoBay_14600',
    new: '12f59f8b-b684-430e-b5f2-2ebee0e03335',
  },
  {
    old: 'UniversalVolcanoBay_14601',
    new: '10da7e41-bdcb-4aec-979d-058325565cc5',
  },
  {
    old: 'UniversalVolcanoBay_14602',
    new: '7f6b4ceb-8129-43ea-b1b4-dab5b9edcf66',
  },
  {
    old: 'UniversalVolcanoBay_14603',
    new: '3a3c8fe9-7895-4c56-89c9-aac6d923356d',
  },
  {
    old: 'UniversalVolcanoBay_14604',
    new: '6fd38007-60d4-44cd-802c-13c3e9376267',
  },
  {
    old: 'UniversalVolcanoBay_14605',
    new: 'c641eebb-baa6-4573-b110-0edd752bbc7a',
  },
  {
    old: 'UniversalVolcanoBay_14606',
    new: '3e26ef97-0ef4-49b5-8202-da7f5d1e7909',
  },
  {
    old: 'UniversalVolcanoBay_14607',
    new: 'b7ec0e94-e2bf-40b6-9c7a-a5dee143efdc',
  },
  {
    old: 'UniversalVolcanoBay_14608',
    new: '5f1005d2-410d-433e-93ec-c8a6a37f4d34',
  },
  {
    old: 'UniversalVolcanoBay_14609',
    new: '26541d09-3004-4d9c-9aee-58a7aea98c1c',
  },
  {
    old: 'UniversalVolcanoBay_14610',
    new: '09e16a0e-80d8-4569-929f-90252bd724cb',
  },
  {
    old: 'UniversalVolcanoBay_16288',
    new: '6651ad75-8338-48b6-8ae7-915585f99983',
  },
  {
    old: 'UniversalVolcanoBay_18016',
    new: '89f2586a-328a-413e-802f-307260d9ce37',
  },
  {
    old: 'UniversalVolcanoBay_18017',
    new: '3e26ef97-0ef4-49b5-8202-da7f5d1e7909',
  },
  {
    old: 'UniversalVolcanoBay_18018',
    new: '3c1498f0-69d2-4f19-b585-ea050f85c844',
  },
  {
    old: 'UniversalVolcanoBay_18019',
    new: '3a3c8fe9-7895-4c56-89c9-aac6d923356d',
  },
  {
    old: 'UniversalVolcanoBay_18020',
    new: 'c641eebb-baa6-4573-b110-0edd752bbc7a',
  },
  {
    old: 'UniversalVolcanoBay_18021',
    new: '5f1005d2-410d-433e-93ec-c8a6a37f4d34',
  },
  {
    old: 'UniversalVolcanoBay_18022',
    new: '6651ad75-8338-48b6-8ae7-915585f99983',
  },
  {
    old: 'UniversalVolcanoBay_18023',
    new: '26541d09-3004-4d9c-9aee-58a7aea98c1c',
  },
  {
    old: 'UniversalVolcanoBay_18024',
    new: '6fd38007-60d4-44cd-802c-13c3e9376267',
  },
  {
    old: 'UniversalVolcanoBay_18025',
    new: '4eb17ae5-c47c-4ad2-97f3-189e56fa6d52',
  },
  {
    old: 'UniversalVolcanoBay_18026',
    new: 'b7ec0e94-e2bf-40b6-9c7a-a5dee143efdc',
  },
  {
    old: 'UniversalVolcanoBay_18027',
    new: 'c1cdeb80-67e3-4b75-b057-440004c8f499',
  },
  {
    old: 'UniversalVolcanoBay_18028',
    new: 'b2a614e0-a40c-4f46-85f9-c0556086f6a8',
  },
  {
    old: 'UniversalVolcanoBay_18029',
    new: '74fde289-fcc3-47dc-ad9b-395efb04e89e',
  },
  {
    old: 'UniversalVolcanoBay_18030',
    new: '9855e94c-7ccb-40a6-a1de-5de82699e1dd',
  },
  {
    old: 'UniversalVolcanoBay_18031',
    new: '10da7e41-bdcb-4aec-979d-058325565cc5',
  },
  {
    old: 'UniversalVolcanoBay_18032',
    new: '12f59f8b-b684-430e-b5f2-2ebee0e03335',
  },
  {
    old: 'UniversalVolcanoBay_18033',
    new: '09e16a0e-80d8-4569-929f-90252bd724cb',
  },
  {
    old: 'UniversalVolcanoBay_18063',
    new: '7f6b4ceb-8129-43ea-b1b4-dab5b9edcf66',
  },
  {
    old: 'DisneylandParisMagicKingdom_P1RA10',
    new: '53895b6d-d25d-4e08-a489-0c3d47dd183f',
  },
  {
    old: 'UniversalIslandsOfAdventure_18196',
    new: 'b694d5a5-155e-4796-af7e-5dbdcf3deba4',
  },
  {
    old: 'Phantasialand_120',
    new: '9a5ed0b3-c3b6-4e89-aa9a-bbdf6ee54ad3',
  },
  {
    old: 'Phantasialand_14',
    new: '97885d46-b39d-4697-8101-68307f7e6d4a',
  },
  {
    old: 'Phantasialand_1',
    new: '5174e77f-e1b8-44a1-9310-d3b6cb28f266',
  },
  {
    old: 'Phantasialand_117',
    new: '0160096b-a04c-4b90-83f9-468131ec72f1',
  },
  {
    old: 'Phantasialand_118',
    new: 'd9ad9763-831c-4e02-99e3-2ec9936f7234',
  },
  {
    old: 'Phantasialand_21',
    new: '154fdf43-92be-4d90-9228-1b8668f84076',
  },
  {
    old: 'Phantasialand_119',
    new: 'b73aedb9-d386-47c2-bd17-40f94ebe938d',
  },
  {
    old: 'Phantasialand_16',
    new: 'ad215bc1-92ca-4c93-9c7c-cd035f19bb14',
  },
  {
    old: 'Phantasialand_17',
    new: '3e64775d-1519-418d-92db-d460426c11b7',
  },
  {
    old: 'Phantasialand_18',
    new: 'd1e5e18d-bf28-4891-b0ed-247fdb1ac37b',
  },
  {
    old: 'Phantasialand_19',
    new: '8254b058-4f59-4bd8-8549-67b4b7012486',
  },
  {
    old: 'Phantasialand_194',
    new: 'bbcb593e-5231-4f10-ada3-30ae6fd7ea49',
  },
  {
    old: 'Phantasialand_2',
    new: '9075b479-c75f-4882-adf8-a441c7f0c15b',
  },
  {
    old: 'Phantasialand_200',
    new: '41f4635a-f1b0-4ca5-8dc2-9df9fe65b45d',
  },
  {
    old: 'Phantasialand_203',
    new: 'abadd16c-3068-4d8d-b0e7-16ae920e34bb',
  },
  {
    old: 'Phantasialand_25',
    new: 'fa868f9e-5be7-48d0-8b46-1c365854e36f',
  },
  {
    old: 'Phantasialand_26',
    new: '94737247-be0e-4f26-87e9-f39acb333de5',
  },
  {
    old: 'Phantasialand_27',
    new: '3f5ecd23-9b02-4786-a3a9-26b576a22525',
  },
  {
    old: 'Phantasialand_28',
    new: '1e88524d-c13c-4342-921b-8df472e049aa',
  },
  {
    old: 'Phantasialand_29',
    new: '4a3c042e-9fc6-4d88-9cf9-dfec1f442c40',
  },
  {
    old: 'Phantasialand_3',
    new: 'fb820c24-8747-499e-ad1e-0d2f8b6e2e5b',
  },
  {
    old: 'Phantasialand_33',
    new: 'e802e820-75e1-406d-8626-f3ca825cf2ff',
  },
  {
    old: 'Phantasialand_4',
    new: '5e27833c-66cd-4b32-b66e-a699b1df83b0',
  },
  {
    old: 'Phantasialand_41',
    new: 'ce203679-4124-4e5c-aca7-046ec21965c4',
  },
  {
    old: 'Phantasialand_42',
    new: 'f9949496-c025-48cc-8b3d-2f361ffe8124',
  },
  {
    old: 'Phantasialand_45',
    new: '7c6e5d9f-31f0-4e14-be9b-58c4625d788b',
  },
  {
    old: 'Phantasialand_5',
    new: '03dde9d9-8ed3-411d-99a1-da7d0a571f04',
  },
  {
    old: 'Phantasialand_52',
    new: 'b0a46890-be18-4291-a6cb-aa99587607ff',
  },
  {
    old: 'Phantasialand_59',
    new: '92b86a07-4e9b-4941-8b70-2447d88bc73a',
  },
  {
    old: 'Phantasialand_6',
    new: 'b4e969be-7534-4164-ae2e-48534d387bd3',
  },
  {
    old: 'Phantasialand_60',
    new: '48c120e2-1435-41d3-b942-15c805ceed90',
  },
  {
    old: 'Phantasialand_61',
    new: '9aa46c76-a3bc-466e-8399-0beef3efb53e',
  },
  {
    old: 'Phantasialand_62',
    new: '33697282-aa04-44ba-8ec4-6ec883fb3e55',
  },
  {
    old: 'Phantasialand_63',
    new: '87fce260-bfed-44b6-8a4f-6b5419ba0a69',
  },
  {
    old: 'Phantasialand_64',
    new: '87ed5d8a-4fd9-43fd-a991-1d0ccb7ee243',
  },
  {
    old: 'Phantasialand_65',
    new: '640c4080-3fc9-4768-8789-3e84f1ab0414',
  },
  {
    old: 'Phantasialand_67',
    new: '2197f935-71f9-44b2-bd65-31c6c561173c',
  },
  {
    old: 'Phantasialand_68',
    new: '7ff58418-8152-41e6-9d2c-fed27844d8fc',
  },
  {
    old: 'Phantasialand_7',
    new: '16cf09a3-ca72-4289-8b3f-97e961b75208',
  },
  {
    old: 'Phantasialand_70',
    new: 'af06bfe4-474c-40c2-9a8b-b4ea2228ab89',
  },
  {
    old: 'Phantasialand_71',
    new: '94ea8ec0-8f98-4d68-9e9b-b2f475fb9e2e',
  },
  {
    old: 'Phantasialand_72',
    new: '3bcf43a3-e227-47e3-9838-de4d3adc442a',
  },
  {
    old: 'Phantasialand_73',
    new: '8de3145a-8e7d-4682-8370-62db04e15856',
  },
  {
    old: 'Phantasialand_76',
    new: 'a468dc40-9a14-4db6-94c9-8a50f809227a',
  },
  {
    old: 'Phantasialand_8',
    new: 'a7005393-76e9-4ff8-8fde-621b662733c6',
  },
];

module.exports = {
  convert: (newId, oldParkId) => {
    const ref = replacements.find((r) => r.new === newId);
    if (ref) {
      return ref.old;
    }
    return `${oldParkId}_${newId}`;
  },
};
