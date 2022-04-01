import * as React from "react"

const useSemiPersistentState = (key, initialState) => {
  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  )

  React.useEffect(() => {
    localStorage.setItem(key,value)
  }, [value, key])

  return [value, setValue]
}

const initialStories = [
  {
    title: 'React',
    url: 'https://reactjs.org',
    author: 'Jordan Walke',
    num_comments: 3,
    points: 4,
    objectID: 0,
  },
  {
    title: 'Redux',
    url: 'https://redux.js.org/',
    author: 'Dan Abramov, Andrew Clark',
    num_comments: 2,
    points: 5,
    objectID: 1,
  }
]

// const getAsyncStories = () =>
//   new Promise((resolve) =>
//     setTimeout(
//       () => resolve({ data: { stories: initialStories }}),
//       2000
//     )
//   )
  const getAsyncStories = () =>
  new Promise((resolve, reject) => setTimeout(reject, 2000))

  const storiesReducer = (state, action) => {
    switch (action.type) {
      case 'STORIES_FETCH_INIT':
        return {
          ...state,
          isLoading: true,
          isError: false,
        };
      case 'STORIES_FETCH_SUCCESS':
        return {
          ...state,
          isLoading: false,
          isError: false,
          data: action.payload,
        };
      case 'STORIES_FETCH_FAILURE':
        return {
          ...state,
          isLoading: false,
          isError: true,
        };
      case 'REMOVE_STORY':
        return {
          ...state,
          data: state.data.filter(
            (story) => action.payload.objectID !== story.objectID
          ),
        };
      default:
        throw new Error();
    }
  }

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query='

const App = () => {
  const [stories, dispatchStories] = React.useReducer(
    storiesReducer,
    { data: [], isLoading: false, isError: false }
  )

  const [searchTerm, setSearchTerm] = useSemiPersistentState('search', 'React')

  const [url, setUrl] = React.useState(
    `${API_ENDPOINT}${searchTerm}`
  )

  const handleFetchStories = React.useCallback(() => { // B
    dispatchStories({ type: 'STORIES_FETCH_INIT' });

    fetch(url)
      .then((response) => response.json())
      .then((result) => {
        dispatchStories({
          type: 'STORIES_FETCH_SUCCESS',
          payload: result.hits,
        });
      })
      .catch(() =>
        dispatchStories({ type: 'STORIES_FETCH_FAILURE' })
      );
  }, [url]); // E

  React.useEffect(() => {
    handleFetchStories(); // C
  }, [handleFetchStories]); // D”

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchSubmit = () => {
    setUrl(`${API_ENDPOINT}${searchTerm}`)
  }

  const handleRemoveStory = (item) => {
    console.log('clicked dismiss')
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item,
    })
  }

  const searchedStories = stories.data.filter(story => {
    return story.title.toLowerCase().includes(searchTerm.toLowerCase())
  })


  return (
    <div>
      <h1>My Hacker Stories</h1>

      <InputWithLabel
        id="search"
        type="text"
        value={searchTerm}
        isFocused
        onInputChange={handleSearchInput}
      >
        <strong>Search: </strong>
      </InputWithLabel>

      <button
        type="button"
        disabled={!searchTerm}
        onClick={handleSearchSubmit}
      >
        Submit
      </button>
      <hr/>
      {stories.isError && <p>Something went wrong...</p>}
      {stories.isLoading 
        ? <p>Loading....</p>
        : <List list={searchedStories} onRemoveItem={handleRemoveStory}/>
      }
    </div>
  );
}

const InputWithLabel = ({ id, value, type, onInputChange, isFocused, children }) => {

  const inputRef = React.useRef()

  React.useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isFocused])

  return (
    <div>
      <label htmlFor={id}>{children}</label>
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={onInputChange}
      />
    </div>
  )
}

const List = ({ list, onRemoveItem }) => (
  <ul>
    {list.map((item) => (
      <Item 
        key={item.objectID}
        onRemoveItem={onRemoveItem}
        item={item}
      />
    ))}
  </ul>
)

const Item = ({item, onRemoveItem}) => {
  const handleRemoveItem = () => {
    onRemoveItem(item)
  }

  return (
    <li>
      <span>
        <a href={item.url}>{item.title}</a>
      </span>
      <span>{item.author}</span>
      <span>{item.num_comments}</span>
      <span>{item.points}</span>
      <span>
        <button type="button" onClick={(handleRemoveItem)}>
          Dismiss
        </button>
      </span>
    </li>
  )
}

export default App;
