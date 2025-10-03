import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const directus = createDirectus(import.meta.env.DIRECTUS_URL)
  .with(rest())
  .with(staticToken(import.meta.env.DIRECTUS_TOKEN));

export async function getEvents() {
  const response = await directus.request(
    readItems('events', {
      fields: ['id', 'title', 'date', 'location', 'description']
    })
  );
  console.log("Events response:", JSON.stringify(response, null, 2));
  return response;
}

export async function getAgendas() {
  const response = await directus.request(
    readItems('agendas', {
      fields: [
        'id',
        'meeting_date',
        'agenda_id',
        'category',
        'agenda_items.id',
        'agenda_items.order',
        'agenda_items.topic',
        'agenda_items.description'
      ],
      sort: ['-meeting_date'] // Most recent first
    })
  );
  console.log("Agendas response:", JSON.stringify(response, null, 2));
  return response;
}

export async function getContacts() {
  const response = await directus.request(
    readItems('contacts', {
      fields: [
        'id',
        'first_name',
        'last_name',
        'email_address',
        'role',
        'organisation_id.organisation_name'
      ]
    })
  );
  console.log("Contacts response:", JSON.stringify(response, null, 2));
  return response;
}

export async function getMembers() {
  try {
    const response = await directus.request(
      readItems('members', {
        fields: [
          'id',
          'first_name',
          'last_name',
          'committee_role_id.committee_role',
          'committee_role_id.id'
        ],
        sort: ['last_name']
      })
    );
    console.log("Members response:", JSON.stringify(response, null, 2));
    return response || [];
  } catch (error) {
    console.error("Error fetching members:", error);
    throw error;
  }
}

export async function getGlobals() {
  const response = await directus.request(
    readItems('site_globals', {
      fields: ['site_title', 'site_description']
    })
  );
  console.log("Globals response:", JSON.stringify(response, null, 2));
  return response;
}