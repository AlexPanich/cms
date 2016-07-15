@extends('layouts.page')

@section('content')
    <h3>Результаты поиска</h3>
    @if(count($results) > 0)
        @if(!key_exists('error',$results))
            @foreach($results as $table => $result)
                @include($templates[$table], ['result' => $result])
            @endforeach
        @else
            Ошибка: {{ $results['error'] }}
        @endif
    @else
        <span>Ничего не найдено</span>
    @endif
@endsection