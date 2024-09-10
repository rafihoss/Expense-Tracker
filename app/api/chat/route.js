import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
  try {
    const { input } = await req.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `
      You are an AI-powered assistant designed to help users manage and track their shared expenses. Your role is to parse natural language expense inputs and return structured data that includes the date, description, amount, payer, participants, and balances. 
      The input may include percentages for splitting the bill. You should calculate the split amount for each participant based on the given percentages and return the result as valid JSON in the following format:
      {
        "date": "09-04-2024",
        "description": "Rent",
        "amount": 2400,
        "paidBy": "Rafi",
        "participants": ["Rafi", "Alif", "Arafat"],
        "balance": {
          "Rafi": 960,
          "Alif": 720,
          "Arafat": 720
        }
      }
      Ensure that the date is in MM-DD-YYYY format, and if there are percentages, convert them into amounts. If any information is missing, make an educated guess.
    `;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse the following expense input: "${input}"` },
      ],
      max_tokens: 150,
    });

    let result = completion.choices[0].message.content.trim();

    console.log("OpenAI raw response:", result); // Log the raw OpenAI response

    // Extract the valid JSON portion of the response using a regex to find the JSON object
    const jsonMatch = result.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      throw new Error('No valid JSON found in the OpenAI response.');
    }

    let expense;
    try {
      expense = JSON.parse(jsonMatch[0]); // Parse the extracted JSON
    } catch (error) {
      console.error('Error parsing JSON from OpenAI:', error);
      return NextResponse.json({ success: false, error: 'Invalid JSON response from OpenAI.' });
    }

    return NextResponse.json({ success: true, expense });

  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json({ success: false, error: 'Server error. Please try again later.' });
  }
}
