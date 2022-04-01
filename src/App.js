import * as React from "react"
import axios from 'axios'
import './App.css'
import { ReactComponent as Check } from './check.svg'

const useSemiPersistentState = (key, initialState) => {
  const isMounted = React.useRef(false)

  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  )

  React.useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
    } else {
      console.log('A')
      localStorage.setItem(key,value)
    }
  }, [value, key])

  return [value, setValue]
}

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

  const handleFetchStories = React.useCallback(async () => {
    dispatchStories({ type: 'STORIES_FETCH_INIT' });

    try {
      const result = await axios.get(url)
    
      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.data.hits,
      });
    } catch {
      dispatchStories({ type: 'STORIES_FETCH_FAILURE' })
    }
  }, [url])

  React.useEffect(() => {
    handleFetchStories(); // C
  }, [handleFetchStories]); // D”

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchSubmit = (e) => {
    setUrl(`${API_ENDPOINT}${searchTerm}`)
    e.preventDefault()
  }

  const handleRemoveStory = React.useCallback((item) => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item,
    })
  }, [])

  const searchedStories = stories.data.filter(story => {
    return story.title.toLowerCase().includes(searchTerm.toLowerCase())
  })

  console.log('B:App')

  return (
    <div className="container">
      <h1 className="headline-primary">My Hacker Stories</h1>

      <SearchForm
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />
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
      <label htmlFor={id} className="label"
      >
        {children}
      </label>
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={onInputChange}
        className="input"
      />
    </div>
  )
}

const List = React.memo(
  ({ list, onRemoveItem }) => (
    console.log('B:List') || (
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
))

const Item = ({item, onRemoveItem}) => {
  const handleRemoveItem = () => {
    onRemoveItem(item)
  }

  return (
    <li className="item">
      <span style={{ width: '40%' }}>
        <a href={item.url}>{item.title}</a>
      </span>
      <span style={{ width: '30%' }}>{item.author}</span>
      <span style={{ width: '10%' }}>{item.num_comments}</span>
      <span style={{ width: '10%' }}>{item.points}</span>
      <span style={{ width: '10%' }}>
        <button 
          type="button"
          onClick={(handleRemoveItem)}
          className="button button_small"
        >
          <Check height="18px" width="18px" />
        </button>
      </span>
    </li>
  )
}

const SearchForm = ({
  searchTerm,
  onSearchInput,
  onSearchSubmit,
}) => (
  <form onSubmit={onSearchSubmit} className="search-form">
    <InputWithLabel
      id="search"
      value={searchTerm}
      isFocused
      onInputChange={onSearchInput}
    >
      <strong>Search:</strong>
    </InputWithLabel>

    <button 
      type="submit" 
      disabled={!searchTerm}
      className="button button_large"
    >
      Submit
    </button>
  </form>
)
export default App;
