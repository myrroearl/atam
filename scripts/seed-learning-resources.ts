import { supabaseServer } from "@/lib/student/supabaseServer"

async function seedLearningResources() {
  console.log('Seeding learning resources...')

  const sampleResources = [
    {
      title: "Introduction to Machine Learning",
      description: "Comprehensive course covering the fundamentals of machine learning algorithms and applications.",
      type: "course",
      source: "Coursera",
      url: "https://coursera.org/learn/machine-learning",
      author: "Andrew Ng",
      topics: ["Machine Learning", "AI", "Statistics"],
      tags: ["beginner", "algorithms", "data-science"],
      likes: 1250,
      dislikes: 25,
      is_active: true
    },
    {
      title: "The Art of Computer Programming",
      description: "Classic computer science textbook series by Donald Knuth.",
      type: "book",
      source: "Google Books",
      url: "https://books.google.com/books?id=example1",
      author: "Donald Knuth",
      topics: ["Computer Science", "Algorithms", "Programming"],
      tags: ["classic", "advanced", "reference"],
      likes: 890,
      dislikes: 15,
      is_active: true
    },
    {
      title: "React Tutorial for Beginners",
      description: "Step-by-step tutorial for learning React.js from scratch.",
      type: "video",
      source: "YouTube",
      url: "https://youtube.com/watch?v=example1",
      author: "Programming Hero",
      topics: ["React", "JavaScript", "Frontend"],
      tags: ["tutorial", "beginner", "web-development"],
      likes: 2100,
      dislikes: 50,
      is_active: true
    },
    {
      title: "Advanced Data Structures and Algorithms",
      description: "In-depth exploration of complex data structures and algorithmic patterns.",
      type: "course",
      source: "edX",
      url: "https://edx.org/learn/data-structures",
      author: "MIT",
      topics: ["Data Structures", "Algorithms", "Computer Science"],
      tags: ["advanced", "computer-science", "algorithms"],
      likes: 1800,
      dislikes: 30,
      is_active: true
    },
    {
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      description: "Essential principles for writing clean, maintainable code.",
      type: "book",
      source: "Google Books",
      url: "https://books.google.com/books?id=example2",
      author: "Robert C. Martin",
      topics: ["Software Engineering", "Programming", "Best Practices"],
      tags: ["clean-code", "software-engineering", "programming"],
      likes: 3200,
      dislikes: 40,
      is_active: true
    },
    {
      title: "JavaScript ES6+ Features Explained",
      description: "Comprehensive guide to modern JavaScript features and syntax.",
      type: "video",
      source: "YouTube",
      url: "https://youtube.com/watch?v=example2",
      author: "Web Dev Simplified",
      topics: ["JavaScript", "ES6", "Web Development"],
      tags: ["javascript", "es6", "web-development"],
      likes: 1500,
      dislikes: 20,
      is_active: true
    },
    {
      title: "Database Design Fundamentals",
      description: "Learn the principles of good database design and normalization.",
      type: "article",
      source: "Wikipedia",
      url: "https://en.wikipedia.org/wiki/Database_design",
      author: "Wikipedia Contributors",
      topics: ["Database", "Design", "Normalization"],
      tags: ["database", "design", "fundamentals"],
      likes: 750,
      dislikes: 10,
      is_active: true
    },
    {
      title: "Python for Data Science",
      description: "Complete guide to using Python for data analysis and visualization.",
      type: "course",
      source: "Udemy",
      url: "https://udemy.com/course/python-data-science",
      author: "Data Science Academy",
      topics: ["Python", "Data Science", "Analytics"],
      tags: ["python", "data-science", "analytics"],
      likes: 4200,
      dislikes: 80,
      is_active: true
    }
  ]

  try {
    // Clear existing data (optional - remove this if you want to keep existing data)
    const { error: deleteError } = await supabaseServer
      .from('learning_resources')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (deleteError) {
      console.error('Error clearing existing data:', deleteError)
    }

    // Insert sample data
    const { data, error } = await supabaseServer
      .from('learning_resources')
      .insert(sampleResources)
      .select()

    if (error) {
      console.error('Error inserting sample data:', error)
      return
    }

    console.log(`Successfully inserted ${data?.length || 0} learning resources`)
    console.log('Sample data inserted:', data)
  } catch (error) {
    console.error('Error seeding learning resources:', error)
  }
}

// Run the seeding function
seedLearningResources()
  .then(() => {
    console.log('Seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })
