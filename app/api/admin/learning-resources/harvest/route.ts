import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/student/supabaseServer"
import { GoogleGenerativeAI } from '@google/generative-ai'
import { harvestYouTubeVideos, getHarvestingStats } from '@/lib/youtube-harvester'
import { deduplicateResources, cleanResourcesForInsertion, logDuplicateSummary } from '@/lib/resource-deduplicator'

// Initialize Gemini AI
const API_KEY = 'AIzaSyDSnDgk8LUcsArTuJ_7uwHWCUlrYqH1vmM'
const genAI = new GoogleGenerativeAI(API_KEY)

// POST - Trigger data harvesting process
export async function POST(request: NextRequest) {
  try {
    console.log('='.repeat(80))
    console.log('🚀 Data harvesting process started with Gemini AI + YouTube API')
    console.log('='.repeat(80))
    
    // Step 1: Extract academic context from database
    console.log('\n📊 Step 1: Extracting academic context from database...')
    const academicContext = await extractAcademicContext()
    console.log(`✅ Extracted context from ${academicContext.classes.length} classes and ${academicContext.gradeEntries.length} grade entries`)
    console.log(`✅ Identified ${academicContext.subjects.length} subjects and ${academicContext.topics.length} topics`)
    
    // Step 2: Generate learning resources from BOTH sources in parallel
    let geminiResources: any[] = []
    let youtubeResources: any[] = []
    
    if (academicContext.classes.length > 0 || academicContext.gradeEntries.length > 0) {
      console.log('\n🤖 Step 2: Generating resources from multiple sources...')
      
      // Run both harvesting processes in parallel for efficiency
      const [gemini, youtube] = await Promise.all([
        generateLearningResourcesWithGemini(academicContext),
        harvestYouTubeVideos(academicContext, 2) // 2 videos per topic
      ])
      
      geminiResources = gemini
      youtubeResources = youtube
      
      console.log(`✅ Gemini AI generated: ${geminiResources.length} resources (books, articles, courses, documents)`)
      console.log(`✅ YouTube API harvested: ${youtubeResources.length} educational videos`)
      
    } else {
      // Fallback: Generate generic resources if no academic data
      console.log('\n⚠️  No academic data found, generating generic learning resources...')
      geminiResources = await generateGenericLearningResources()
      console.log(`✅ Generated ${geminiResources.length} generic resources`)
    }
    
    // Step 3: Combine all resources
    const allResources = [...geminiResources, ...youtubeResources]
    console.log(`\n📦 Total resources collected: ${allResources.length}`)
    console.log(`   - Gemini resources: ${geminiResources.length}`)
    console.log(`   - YouTube videos: ${youtubeResources.length}`)
    
    // Step 4: Clean and deduplicate resources before insertion
    if (allResources.length > 0) {
      console.log('\n🧹 Step 3: Cleaning and deduplicating resources...')
      
      // Deduplicate resources (checks against database and within batch)
      const deduplicationResult = await deduplicateResources(allResources)
      
      // Log duplicate summary
      logDuplicateSummary(deduplicationResult.duplicates)
      
      // Clean resources for database insertion
      const cleanedResources = cleanResourcesForInsertion(deduplicationResult.uniqueResources)
      
      console.log(`\n📊 Cleaning Summary:`)
      console.log(`   Original count: ${allResources.length}`)
      console.log(`   After deduplication: ${cleanedResources.length}`)
      console.log(`   Duplicates skipped: ${deduplicationResult.stats.duplicateCount}`)
      console.log(`   Invalid resources: ${deduplicationResult.stats.invalidCount}`)
      
      // Step 5: Insert unique resources into database
      if (cleanedResources.length > 0) {
        console.log('\n💾 Step 4: Inserting unique resources into database...')
        const { data, error } = await supabaseServer
          .from('learning_resources')
          .insert(cleanedResources)
          .select()
        
        if (error) {
          console.error('❌ Database insertion error:', error)
          throw error
        }
        
        console.log(`✅ Successfully inserted ${data?.length || 0} unique resources into database`)
        
        // Get YouTube statistics if available
        const youtubeStats = youtubeResources.length > 0 
          ? getHarvestingStats(youtubeResources)
          : null
        
        console.log('\n' + '='.repeat(80))
        console.log('✨ Data harvesting completed successfully!')
        console.log('='.repeat(80))
        
        return NextResponse.json({ 
          success: true,
          message: 'Data harvesting completed successfully',
          resourcesAdded: data?.length || 0,
          breakdown: {
            geminiResources: geminiResources.length,
            youtubeVideos: youtubeResources.length,
            totalCollected: allResources.length,
            uniqueInserted: data?.length || 0,
            duplicatesSkipped: deduplicationResult.stats.duplicateCount,
            invalidSkipped: deduplicationResult.stats.invalidCount
          },
          academicContext: {
            classesAnalyzed: academicContext.classes.length,
            gradeEntriesAnalyzed: academicContext.gradeEntries.length,
            subjectsIdentified: academicContext.subjects.length,
            topicsIdentified: academicContext.topics.length
          },
          youtubeStats: youtubeStats,
          deduplication: {
            duplicates: deduplicationResult.duplicates,
            stats: deduplicationResult.stats
          },
          preview: data?.slice(0, 5) // Return first 5 resources as preview
        })
      } else {
        console.log('\n⚠️  All resources were duplicates or invalid, nothing to insert')
        return NextResponse.json({
          success: false,
          message: 'All resources were duplicates or invalid',
          resourcesAdded: 0,
          breakdown: {
            geminiResources: geminiResources.length,
            youtubeVideos: youtubeResources.length,
            totalCollected: allResources.length,
            uniqueInserted: 0,
            duplicatesSkipped: deduplicationResult.stats.duplicateCount,
            invalidSkipped: deduplicationResult.stats.invalidCount
          },
          academicContext: {
            classesAnalyzed: academicContext.classes.length,
            gradeEntriesAnalyzed: academicContext.gradeEntries.length,
            subjectsIdentified: academicContext.subjects.length,
            topicsIdentified: academicContext.topics.length
          },
          deduplication: {
            duplicates: deduplicationResult.duplicates,
            stats: deduplicationResult.stats
          }
        })
      }
    }
    
    console.log('\n⚠️  No new learning resources generated')
    return NextResponse.json({
      success: false,
      message: 'No new learning resources generated',
      resourcesAdded: 0,
      academicContext: {
        classesAnalyzed: academicContext.classes.length,
        gradeEntriesAnalyzed: academicContext.gradeEntries.length,
        subjectsIdentified: academicContext.subjects.length,
        topicsIdentified: academicContext.topics.length
      }
    })
    
  } catch (error) {
    console.error('\n❌ Error in data harvesting process:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to complete data harvesting process: ' + (error instanceof Error ? error.message : 'Unknown error') 
      },
      { status: 500 }
    )
  }
}

// Extract academic context from database
async function extractAcademicContext() {
  try {
    console.log('Extracting academic context from database...')
    
    // Fetch classes with their subjects and professors
    const { data: classes, error: classesError } = await supabaseServer
      .from('classes')
      .select(`
        class_id,
        class_name,
        subjects (
          subject_id,
          subject_code,
          subject_name,
          units,
          courses (course_name),
          year_level (name)
        ),
        professors (first_name, last_name, departments (department_name))
      `)

    if (classesError) {
      console.error('Error fetching classes:', classesError)
      throw classesError
    }

    console.log(`Fetched ${classes?.length || 0} classes`)

    // Fetch grade entries with topics and names
    const { data: gradeEntries, error: gradeEntriesError } = await supabaseServer
      .from('grade_entries')
      .select(`
        grade_id,
        topics,
        name,
        classes (
          class_name,
          subjects (subject_name, subject_code)
        ),
        grade_components (component_name),
        learning_outcomes (outcome_description)
      `)
      .limit(1000) // Limit to prevent overwhelming the AI

    if (gradeEntriesError) {
      console.error('Error fetching grade entries:', gradeEntriesError)
      throw gradeEntriesError
    }

    console.log(`Fetched ${gradeEntries?.length || 0} grade entries`)

    // Extract unique subjects with more details
    const subjects = new Set()
    classes?.forEach((cls: any) => {
      if (cls.subjects) {
        subjects.add({
          name: cls.subjects.subject_name,
          code: cls.subjects.subject_code,
          course: cls.subjects.courses?.course_name,
          yearLevel: cls.subjects.year_level?.name,
          units: cls.subjects.units
        })
      }
    })

    // Extract unique topics from grade entries (only from topics column)
    const allTopics = new Set<string>()
    gradeEntries?.forEach((entry: any) => {
      if (entry.topics && Array.isArray(entry.topics)) {
        entry.topics.forEach((topic: string) => {
          if (topic && topic.trim()) {
            allTopics.add(topic.trim())
          }
        })
      }
    })

    // Add subject names as topics
    classes?.forEach((cls: any) => {
      if (cls.subjects && cls.subjects.subject_name) {
        allTopics.add(cls.subjects.subject_name.trim())
      }
    })

    console.log(`Extracted ${subjects.size} unique subjects and ${allTopics.size} unique topics`)

    return {
      classes: classes || [],
      gradeEntries: gradeEntries || [],
      subjects: Array.from(subjects),
      topics: Array.from(allTopics) as string[]
    }
  } catch (error) {
    console.error('Error extracting academic context:', error)
    throw error
  }
}

// Generate generic learning resources when no academic data is available
async function generateGenericLearningResources() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const prompt = `
Generate 30 diverse learning resources for a general academic environment. Create resources across different types: books, articles, courses, and documents.

IMPORTANT: DO NOT generate any video resources. Videos will be sourced separately from YouTube API.

REQUIREMENTS:
1. Generate exactly 30 learning resources (balanced across types: books, articles, courses, documents)
2. EXCLUDE video type completely - focus ONLY on: book, article, course, document
3. Include realistic URLs (use real URLs when possible, or realistic placeholder URLs)
4. Ensure diversity in sources: Coursera, edX, Khan Academy, Google Books, Wikipedia, MIT OpenCourseWare, Academic Journals, etc.
5. Create realistic engagement metrics (likes/dislikes)
6. Use proper academic topics and tags

RESPONSE FORMAT: Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Resource Title",
    "description": "Detailed description of the learning resource",
    "type": "book|article|course|document",
    "source": "Coursera|edX|Khan Academy|Google Books|Wikipedia|MIT OpenCourseWare|Academic Journal|Other",
    "url": "https://example.com/resource-url",
    "author": "Author/Instructor Name",
    "topics": ["Topic1", "Topic2", "Topic3"],
    "tags": ["tag1", "tag2", "tag3"],
    "likes": 0,
    "dislikes": 0,
    "is_active": true
  }
]

Generate diverse resources covering:
- Programming and Computer Science
- Mathematics and Statistics  
- Science and Engineering
- Business and Management
- Languages and Literature
- History and Social Sciences
- Arts and Design
- Health and Medicine

Remember: NO videos! Only books, articles, courses, and documents.
`

    const result = await model.generateContent(prompt)
    const response = result.response
    const generatedText = response.text()
    
    console.log('Gemini response received for generic resources, parsing JSON...')
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON array from Gemini response')
    }
    
    const resources = JSON.parse(jsonMatch[0])
    
    // Validate and limit resources
    if (!Array.isArray(resources)) {
      throw new Error('Gemini response is not an array')
    }
    
    // Limit to 30 resources and validate structure (NO videos)
    const validatedResources = resources.slice(0, 30).map((resource: any) => ({
      title: resource.title || 'Untitled Resource',
      description: resource.description || '',
      type: ['book', 'article', 'course', 'document'].includes(resource.type) ? resource.type : 'other',
      source: resource.source || 'Other',
      url: resource.url || 'https://example.com',
      author: resource.author || 'Unknown',
      topics: Array.isArray(resource.topics) ? resource.topics.slice(0, 5) : [],
      tags: Array.isArray(resource.tags) ? resource.tags.slice(0, 5) : [],
      likes: Math.max(0, Math.floor(Math.random() * 5000)),
      dislikes: Math.max(0, Math.floor(Math.random() * 100)),
      is_active: true
    })).filter(resource => resource.type !== 'video') // Ensure no videos slip through
    
    console.log(`Successfully parsed ${validatedResources.length} generic learning resources from Gemini (excluding videos)`)
    return validatedResources
    
  } catch (error) {
    console.error('Error generating generic learning resources with Gemini:', error)
    // Return some fallback resources if Gemini fails
    return [
      {
        title: "Introduction to Computer Science",
        description: "Basic concepts of computer science and programming",
        type: "course",
        source: "Coursera",
        url: "https://coursera.org/learn/intro-cs",
        author: "Stanford University",
        topics: ["Computer Science", "Programming"],
        tags: ["beginner", "programming"],
        likes: 1500,
        dislikes: 25,
        is_active: true
      },
      {
        title: "Mathematics for Engineers",
        description: "Essential mathematical concepts for engineering students",
        type: "book",
        source: "Google Books",
        url: "https://books.google.com/books?id=math-eng",
        author: "Engineering Publishers",
        topics: ["Mathematics", "Engineering"],
        tags: ["mathematics", "engineering"],
        likes: 800,
        dislikes: 15,
        is_active: true
      }
    ]
  }
}

// Generate learning resources using Gemini AI
async function generateLearningResourcesWithGemini(academicContext: any) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    // Use the pre-extracted topics and subjects from academic context
    const topicsList = academicContext.topics || []
    const classesList = academicContext.classes.map((cls: any) => cls.class_name).filter(Boolean)
    const subjectsList = academicContext.subjects.map((subject: any) => subject.name).filter(Boolean)
    
    // Combine all topics for a comprehensive list
    const allRelevantTopics = [
      ...topicsList,
      ...subjectsList,
      ...classesList
    ].filter((topic, index, array) => array.indexOf(topic) === index) // Remove duplicates
    
    console.log(`Found ${topicsList.length} topics, ${classesList.length} classes, ${subjectsList.length} subjects`)
    console.log(`Combined relevant topics: ${allRelevantTopics.slice(0, 10).join(', ')}${allRelevantTopics.length > 10 ? '...' : ''}`)
    
    // Create a targeted prompt for Gemini
    const prompt = `
Generate 30 targeted learning resources for a university academic environment based on the specific academic context provided below.

IMPORTANT: DO NOT generate any video resources. Videos will be sourced separately from YouTube API.

ACADEMIC CONTEXT - SPECIFIC TOPICS TO FOCUS ON:
- Relevant Topics: ${allRelevantTopics.length > 0 ? allRelevantTopics.join(', ') : 'No specific topics found'}
- Total Topics Found: ${allRelevantTopics.length}
- Grade Entry Topics: ${topicsList.length}
- Class Names: ${classesList.length}
- Subject Names: ${subjectsList.length}

TASK: Generate exactly 30 learning resources that are directly relevant to the topics listed above. Focus on creating resources that would be most helpful for students studying these specific areas.

REQUIREMENTS:
1. Generate exactly 30 learning resources (balanced across types: books, articles, courses, documents)
2. EXCLUDE video type completely - focus ONLY on: book, article, course, document
3. Each resource MUST be directly related to at least one of the topics listed above
4. Use REAL, ACCURATE URLs that correspond to actual learning resources (not placeholder URLs)
5. Ensure diversity in sources: Coursera, edX, Khan Academy, Google Books, Wikipedia, MIT OpenCourseWare, Academic Journals, etc.
6. Create realistic engagement metrics (likes/dislikes)
7. Use the specific topics provided as the primary focus for each resource

RESPONSE FORMAT: Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Resource Title (must be relevant to the topics above)",
    "description": "Detailed description explaining how this resource relates to the academic topics",
    "type": "book|article|course|document",
    "source": "Coursera|edX|Khan Academy|Google Books|Wikipedia|MIT OpenCourseWare|Academic Journal|Other",
    "url": "REAL URL to the actual learning resource",
    "author": "Actual author/instructor/publisher name",
    "topics": ["Specific topic from the list above", "Related subtopic", "Another relevant topic"],
    "tags": ["tag1", "tag2", "tag3"],
    "likes": 0,
    "dislikes": 0,
    "is_active": true
  }
]

IMPORTANT: 
- Focus ONLY on the topics listed above
- Use real URLs that actually exist and are accessible
- Make sure each resource is directly relevant to the academic context
- Prioritize high-quality, educational resources over generic ones
- NO videos! Only books, articles, courses, and documents
- If no specific topics are found, generate general academic resources covering common university subjects
`

    const result = await model.generateContent(prompt)
    const response = result.response
    const generatedText = response.text()
    
    console.log('Gemini response received, parsing JSON...')
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON array from Gemini response')
    }
    
    const resources = JSON.parse(jsonMatch[0])
    
    // Validate and limit resources
    if (!Array.isArray(resources)) {
      throw new Error('Gemini response is not an array')
    }
    
    // Limit to 30 resources and validate structure (NO videos)
    const validatedResources = resources.slice(0, 30).map((resource: any) => ({
      title: resource.title || 'Untitled Resource',
      description: resource.description || '',
      type: ['book', 'article', 'course', 'document'].includes(resource.type) ? resource.type : 'other',
      source: resource.source || 'Other',
      url: resource.url || 'https://example.com',
      author: resource.author || 'Unknown',
      topics: Array.isArray(resource.topics) ? resource.topics.slice(0, 5) : [],
      tags: Array.isArray(resource.tags) ? resource.tags.slice(0, 5) : [],
      likes: 0,
      dislikes: 0,
      is_active: true
    })).filter(resource => resource.type !== 'video') // Ensure no videos slip through
    
    console.log(`Successfully parsed ${validatedResources.length} learning resources from Gemini (excluding videos)`)
    return validatedResources
    
  } catch (error) {
    console.error('Error generating learning resources with Gemini:', error)
    throw error
  }
}

