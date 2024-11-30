import { CodeTemplate } from '@prisma/client';
import { FormEvent, forwardRef, KeyboardEvent, MouseEvent, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type LinkModalProps = {
  onInsert: Function
}

type HasShowFunction = {
  show: Function
  showModal: Function
}


export const LinkModal = forwardRef<HasShowFunction, LinkModalProps>(function ({ onInsert }, ref) {
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CodeTemplate[]>([]);
  const [index, setIndex] = useState(0);

  useImperativeHandle(ref, () => { 
    return dialogRef?.current || 
    { 
      show: () => {}, 
      showModal: () => {}
    }
  }, [])

  useEffect((() => {
    const fetchCodeTemplates = async () => {
      try {
        let response = await fetch(`/api/template?title=${search}`, {
          method: 'GET'
        });
  
        if (!response.ok) {
          console.log(response);
        }
  
        const results: CodeTemplate[] = await response.json();
        setResults(results);
      } catch (error) {
        console.error(error);
      }
    };  

    fetchCodeTemplates();
  }), [search]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (results.length > 0 && ref) {
      onInsert({ title: results[index].title, url: `/templateview/${results[index].id}`, id: results[index].id});
      setSearch('');
      formRef.current?.reset();
      dialogRef.current?.close();
    }
  };

  const handleClose = () => {
    setIndex(0);
    setSearch('');
    formRef.current?.reset();
    dialogRef.current?.close();
  };

  const onClick = useCallback((event: MouseEvent<HTMLDialogElement>) => {
    if (event.target instanceof Node && !overlayRef.current?.contains(event.target)) {
      handleClose();
    }
  }, [])

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDialogElement>) => {
      if (results.length > 0) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault()
            const prevIndex = index >= results.length - 1 ? 0 : index + 1
            setIndex(prevIndex)
            break
          case 'ArrowUp':
            event.preventDefault()
            const nextIndex = index <= 0 ? results.length - 1 : index - 1
            setIndex(nextIndex)
            break
          case 'Tab':
          case 'Enter':
            event.preventDefault()
            onInsert(onInsert({ title: results[index].title, url: `/templateview/${results[index].id}`, id: results[index].id}));
            handleClose();
            break
          case 'Escape':
            event.preventDefault();
            handleClose();
            break
        }
      }
    },
    [results, index])

  return (
    <dialog ref={dialogRef} onClose={handleClose} onKeyDown={onKeyDown} onClick={onClick} autoFocus>
    <div>
      <h3>Insert Link</h3>
      <form onSubmit={handleSubmit} ref={formRef}>
        <input
          type="url"
          placeholder="Enter URL"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          required
        />
          {results.map((result, i) => (
            <div
              key={result.id}
              onClick={() => {
                setSearch('');
                console.log(result);
                onInsert({ title: result.title, url: `/template/${result.id}`, id: result.id});
                formRef.current?.reset();
                handleClose();
              }}
              style={{
                padding: '1px 3px',
                borderRadius: '3px',
                cursor: 'pointer',
                background: i === index ? '#B4D5FF' : 'transparent',
              }}
              >
              {result.title}
            </div>
          ))}
          <div>
          <button type="submit">Insert Link</button>
          <button type="button" onClick={handleClose}>Cancel</button>
        </div>
      </form>
      </div>
    </dialog>
  );
});