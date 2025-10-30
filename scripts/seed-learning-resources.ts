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
    },
    // Mathematics Resources
    {
      title: "Calculus Made Easy",
      description: "Step-by-step calculus tutorial for beginners and advanced students.",
      type: "video",
      source: "YouTube",
      url: "https://youtube.com/watch?v=calculus1",
      author: "Math Professor",
      topics: ["Calculus", "Mathematics", "Derivatives"],
      tags: ["math", "calculus", "tutorial"],
      likes: 3200,
      dislikes: 45,
      is_active: true
    },
    {
      title: "Linear Algebra Fundamentals",
      description: "Comprehensive textbook covering vectors, matrices, and linear transformations.",
      type: "book",
      source: "Google Books",
      url: "https://books.google.com/books?id=linear1",
      author: "Dr. Sarah Johnson",
      topics: ["Linear Algebra", "Mathematics", "Vectors"],
      tags: ["math", "linear-algebra", "textbook"],
      likes: 1800,
      dislikes: 20,
      is_active: true
    },
    {
      title: "Statistics and Probability",
      description: "Complete course on statistical analysis and probability theory.",
      type: "course",
      source: "Khan Academy",
      url: "https://khanacademy.org/statistics",
      author: "Khan Academy",
      topics: ["Statistics", "Probability", "Mathematics"],
      tags: ["statistics", "probability", "math"],
      likes: 5600,
      dislikes: 30,
      is_active: true
    },
    // Computer Science Resources
    {
      title: "Data Structures and Algorithms",
      description: "Comprehensive guide to fundamental computer science concepts.",
      type: "course",
      source: "Coursera",
      url: "https://coursera.org/learn/data-structures",
      author: "Stanford University",
      topics: ["Algorithms", "Data Structures", "Computer Science"],
      tags: ["algorithms", "data-structures", "programming"],
      likes: 8900,
      dislikes: 120,
      is_active: true
    },
    {
      title: "JavaScript Complete Guide",
      description: "From beginner to advanced JavaScript programming tutorial.",
      type: "video",
      source: "YouTube",
      url: "https://youtube.com/watch?v=js1",
      author: "Code Academy",
      topics: ["JavaScript", "Programming", "Web Development"],
      tags: ["javascript", "programming", "web"],
      likes: 4500,
      dislikes: 60,
      is_active: true
    },
    {
      title: "Database Design Principles",
      description: "Learn how to design efficient and scalable databases.",
      type: "article",
      source: "Medium",
      url: "https://medium.com/database-design",
      author: "Database Expert",
      topics: ["Database", "SQL", "Design"],
      tags: ["database", "sql", "design"],
      likes: 2100,
      dislikes: 25,
      is_active: true
    },
    // Science Resources
    {
      title: "Physics Fundamentals",
      description: "Complete physics course covering mechanics, thermodynamics, and waves.",
      type: "course",
      source: "MIT OpenCourseWare",
      url: "https://ocw.mit.edu/physics",
      author: "MIT Faculty",
      topics: ["Physics", "Mechanics", "Thermodynamics"],
      tags: ["physics", "science", "mechanics"],
      likes: 7200,
      dislikes: 80,
      is_active: true
    },
    {
      title: "Chemistry Laboratory Techniques",
      description: "Essential laboratory skills and safety procedures for chemistry students.",
      type: "video",
      source: "YouTube",
      url: "https://youtube.com/watch?v=chem1",
      author: "Chemistry Lab",
      topics: ["Chemistry", "Laboratory", "Safety"],
      tags: ["chemistry", "lab", "safety"],
      likes: 1800,
      dislikes: 15,
      is_active: true
    },
    {
      title: "Biology: Cell Structure and Function",
      description: "Detailed study of cellular biology and molecular processes.",
      type: "book",
      source: "Google Books",
      url: "https://books.google.com/books?id=biology1",
      author: "Dr. Michael Chen",
      topics: ["Biology", "Cell Biology", "Molecular Biology"],
      tags: ["biology", "cells", "molecular"],
      likes: 2900,
      dislikes: 40,
      is_active: true
    },
    // Language and Literature
    {
      title: "English Grammar Mastery",
      description: "Complete guide to English grammar rules and usage.",
      type: "course",
      source: "Udemy",
      url: "https://udemy.com/english-grammar",
      author: "Language Expert",
      topics: ["English", "Grammar", "Language"],
      tags: ["english", "grammar", "language"],
      likes: 3400,
      dislikes: 50,
      is_active: true
    },
    {
      title: "Creative Writing Workshop",
      description: "Learn the art of creative writing and storytelling.",
      type: "video",
      source: "YouTube",
      url: "https://youtube.com/watch?v=writing1",
      author: "Writing Coach",
      topics: ["Writing", "Creative Writing", "Literature"],
      tags: ["writing", "creative", "storytelling"],
      likes: 1600,
      dislikes: 20,
      is_active: true
    },
    // History and Social Sciences
    {
      title: "World History Timeline",
      description: "Comprehensive overview of world history from ancient to modern times.",
      type: "document",
      source: "Wikipedia",
      url: "https://en.wikipedia.org/wiki/World_history",
      author: "Wikipedia Contributors",
      topics: ["History", "World History", "Timeline"],
      tags: ["history", "world", "timeline"],
      likes: 4200,
      dislikes: 100,
      is_active: true
    },
    {
      title: "Psychology 101",
      description: "Introduction to psychological principles and human behavior.",
      type: "course",
      source: "Coursera",
      url: "https://coursera.org/learn/psychology",
      author: "Yale University",
      topics: ["Psychology", "Behavior", "Mental Health"],
      tags: ["psychology", "behavior", "mental-health"],
      likes: 5100,
      dislikes: 70,
      is_active: true
    },
    // Business and Economics
    {
      title: "Microeconomics Principles",
      description: "Understanding individual economic behavior and market dynamics.",
      type: "book",
      source: "Google Books",
      url: "https://books.google.com/books?id=micro1",
      author: "Dr. Economics",
      topics: ["Economics", "Microeconomics", "Market"],
      tags: ["economics", "microeconomics", "market"],
      likes: 2200,
      dislikes: 30,
      is_active: true
    },
    {
      title: "Business Strategy Fundamentals",
      description: "Learn how to develop and implement effective business strategies.",
      type: "course",
      source: "Harvard Business School",
      url: "https://hbs.edu/strategy",
      author: "Harvard Faculty",
      topics: ["Business", "Strategy", "Management"],
      tags: ["business", "strategy", "management"],
      likes: 6800,
      dislikes: 90,
      is_active: true
    },
    // Arts and Design
    {
      title: "Digital Art and Design",
      description: "Introduction to digital art creation and graphic design principles.",
      type: "video",
      source: "YouTube",
      url: "https://youtube.com/watch?v=digitalart1",
      author: "Design Studio",
      topics: ["Art", "Design", "Digital Art"],
      tags: ["art", "design", "digital"],
      likes: 2800,
      dislikes: 35,
      is_active: true
    },
    {
      title: "Music Theory Basics",
      description: "Learn the fundamentals of music theory and composition.",
      type: "course",
      source: "Udemy",
      url: "https://udemy.com/music-theory",
      author: "Music Professor",
      topics: ["Music", "Theory", "Composition"],
      tags: ["music", "theory", "composition"],
      likes: 1900,
      dislikes: 25,
      is_active: true
    },
    // Technology and Engineering
    {
      title: "Introduction to Robotics",
      description: "Learn the basics of robotics and automation systems.",
      type: "course",
      source: "MIT OpenCourseWare",
      url: "https://ocw.mit.edu/robotics",
      author: "MIT Faculty",
      topics: ["Robotics", "Engineering", "Automation"],
      tags: ["robotics", "engineering", "automation"],
      likes: 4100,
      dislikes: 55,
      is_active: true
    },
    {
      title: "Cybersecurity Fundamentals",
      description: "Essential knowledge for protecting digital systems and data.",
      type: "article",
      source: "Medium",
      url: "https://medium.com/cybersecurity",
      author: "Security Expert",
      topics: ["Cybersecurity", "Security", "Technology"],
      tags: ["cybersecurity", "security", "technology"],
      likes: 3600,
      dislikes: 40,
      is_active: true
    },
    // Health and Medicine
    {
      title: "Human Anatomy and Physiology",
      description: "Comprehensive study of the human body systems and functions.",
      type: "book",
      source: "Google Books",
      url: "https://books.google.com/books?id=anatomy1",
      author: "Dr. Medical Expert",
      topics: ["Anatomy", "Physiology", "Medicine"],
      tags: ["anatomy", "physiology", "medicine"],
      likes: 5200,
      dislikes: 60,
      is_active: true
    },
    {
      title: "Nutrition and Health",
      description: "Understanding the relationship between nutrition and human health.",
      type: "video",
      source: "YouTube",
      url: "https://youtube.com/watch?v=nutrition1",
      author: "Health Expert",
      topics: ["Nutrition", "Health", "Wellness"],
      tags: ["nutrition", "health", "wellness"],
      likes: 2400,
      dislikes: 30,
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